export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@clerk/nextjs/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import Session from "@/models/Session";
import { buildInterviewerSystemPrompt } from "@/lib/ai/interviewerPrompt";
import { assertRateLimit } from "@/lib/rateLimit";

import Groq from "groq-sdk";
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const bodySchema = z.object({ message: z.string().min(2, "Message is required") });

export async function POST(req, ctx) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { params } = ctx || {};
  const { id } = (await params) || {};
  if (!id) return NextResponse.json({ error: "Missing session id" }, { status: 400 });

  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json || {});
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", details: parsed.error.issues.map(i => i.message) }, { status: 400 });
  }
  const userText = parsed.data.message;

  await connectDB();
  const mongoUser = await User.findOne({ clerkId: userId }).lean();
  if (!mongoUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

  try {
    assertRateLimit({ key: `${mongoUser._id}:chat`, limit: 20, windowMs: 60_000 });
  } catch (e) {
    return NextResponse.json({ error: e.message, retryAfter: e.retryAfter }, { status: e.status || 429 });
  }

  const session = await Session.findOne({ _id: id, userId: mongoUser._id, $or: [{ deletedAt: null }, { deletedAt: { $exists: false } }] });
  if (!session) return NextResponse.json({ error: "Session not found" }, { status: 404 });

  const systemPrompt = buildInterviewerSystemPrompt({
    role: session.role || "Software Engineer",
    company: session.company || "Company",
    persona: session?.settings?.persona || "tough-but-fair",
    difficulty: session?.settings?.difficulty || "normal",
    timeboxSec: session?.settings?.timeboxSec || 90,
    mode: session?.settings?.mode && session.settings.mode !== "pending" ? session.settings.mode : "combo",
    resumeText: session?.resumeText || "",
    jdText: session?.jdText || "",
  });

  const recent = (session.transcript || [])
    .slice(-10)
    .map((t) => ({ role: t.speaker === "ai" ? "assistant" : "user", content: t.text }));

  try {
    const completion = await groq.chat.completions.create({
      model: process.env.GROQ_CHAT_MODEL || "llama-3.1-8b-instant",
      temperature: 0.5,
      messages: [
        { role: "system", content: systemPrompt },
        ...recent,
        { role: "user", content: userText },
      ],
    });

    const aiText =
      completion?.choices?.[0]?.message?.content?.trim() ||
      "Thanks. Could you add concrete details (numbers, tooling, trade-offs)?";

    if (!Array.isArray(session.transcript)) session.transcript = [];
    session.transcript.push(
      { speaker: "user", text: userText, ts: new Date() },
      { speaker: "ai", text: aiText, ts: new Date() }
    );

    if (!Array.isArray(session.activity)) session.activity = [];
    session.activity.push({ action: "chat", at: new Date(), meta: { turns: session.transcript.length } });

    await session.save();

    return NextResponse.json({ ok: true, reply: aiText });
  } catch (err) {
    console.error("Chat error:", err);
    return NextResponse.json({ error: "AI error" }, { status: 500 });
  }
}
