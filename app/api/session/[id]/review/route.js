export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@clerk/nextjs/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import Session from "@/models/Session";
import { evaluatorPrompt } from "@/lib/ai/evaluatorPrompt";
import { assertRateLimit, rateKey } from "@/lib/rateLimit";
import Groq from "groq-sdk";
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const bodySchema = z.object({ force: z.boolean().optional() });

function safeJSON(text) {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start < 0 || end <= start) throw new Error("No JSON object found");
  return JSON.parse(text.slice(start, end + 1));
}

export async function POST(req, ctx) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  // ❸ Rate limit: 5 reviews / 10 min per user
  try {
    assertRateLimit({
      key: rateKey(["review", userId]),
      limit: 5,
      windowMs: 10 * 60_000,
      errorMsg: "You’ve requested review too frequently. Please try later.",
    });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: e.status || 429 });
  }

  const { params } = ctx || {};
  const { id } = (await params) || {};
  if (!id) return NextResponse.json({ error: "Missing session id" }, { status: 400 });

  const payload = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(payload || {});
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.issues.map(i => i.message) },
      { status: 400 }
    );
  }

  await connectDB();
  const mongoUser = await User.findOne({ clerkId: userId }).lean();
  if (!mongoUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

  try {
    assertRateLimit({ key: `${mongoUser._id}:review`, limit: 5, windowMs: 60_000 });
  } catch (e) {
    return NextResponse.json({ error: e.message, retryAfter: e.retryAfter }, { status: e.status || 429 });
  }

  const session = await Session.findOne({ _id: id, userId: mongoUser._id, $or: [{ deletedAt: null }, { deletedAt: { $exists: false } }] });
  if (!session) return NextResponse.json({ error: "Session not found" }, { status: 404 });

  const prompt = evaluatorPrompt({
    role: session.role || "Software Engineer",
    company: session.company || "Company",
    jdText: session.jdText || "",
    resumeText: session.resumeText || "",
    transcript: session.transcript || [],
  });

  try {
    const completion = await groq.chat.completions.create({
      model: process.env.GROQ_CHAT_MODEL || "llama-3.1-8b-instant",
      temperature: 0.2,
      messages: [{ role: "system", content: prompt }],
    });

    const raw = completion?.choices?.[0]?.message?.content || "{}";
    let parsedJSON = {};
    try {
      parsedJSON = safeJSON(raw);
    } catch {
      const fix = await groq.chat.completions.create({
        model: process.env.GROQ_CHAT_MODEL || "llama-3.1-8b-instant",
        temperature: 0,
        messages: [
          { role: "system", content: "Return STRICT JSON matching the required schema. No prose." },
          { role: "user", content: raw },
        ],
      });
      parsedJSON = safeJSON(fix?.choices?.[0]?.message?.content || "{}");
    }

    if (!parsedJSON || typeof parsedJSON !== "object" || !parsedJSON.categories) {
      throw new Error("Malformed evaluation JSON");
    }

    session.scores = {
      overall: Math.max(0, Math.min(10, Number(parsedJSON.overall ?? 0))),
      categories: parsedJSON.categories,
    };
    session.feedback = {
      strengths: parsedJSON.strengths || [],
      areas_for_improvement: parsedJSON.areas_for_improvement || [],
      recommendations: parsedJSON.recommendations || [],
      summary: parsedJSON.summary || "",
      hire_recommendation: parsedJSON.recommendation || "borderline",
    };

    if (!Array.isArray(session.activity)) session.activity = [];
    session.activity.push({ action: "reviewed", at: new Date(), meta: { overall: session.scores.overall ?? null } });

    await session.save();

    return NextResponse.json({ ok: true, scores: session.scores, feedback: session.feedback });
  } catch (err) {
    console.error("Review error:", err);
    return NextResponse.json({ error: "Evaluation failed" }, { status: 500 });
  }
}
