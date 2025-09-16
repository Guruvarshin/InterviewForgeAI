export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { z } from "zod";
import Groq from "groq-sdk";
import { assertRateLimit, getClientIP, rateKey } from "@/lib/rateLimit";
const bodySchema = z.object({
  message: z.string().min(2),
  history: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string(),
      })
    )
    .optional(),
});

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const SYSTEM_PROMPT = [
  "You are Karier (aka Kariena), a concise, practical career coach.",
  "Audience: software/tech job seekers and juniors.",
  "Style: warm, encouraging, actionable; 2-6 short sentences per reply, with bullet points when useful.",
  "Always tailor advice to the user's input and context; ask one clarifying question only when essential.",
  "Avoid legal/medical/financial opinions; suggest reputable resources instead.",
  "Never store personal data; do not request sensitive info.",
].join("\n");

export async function POST(req) {
  try {
    const ip = getClientIP(req);
    assertRateLimit({
      key: rateKey(["coach", ip]),
      limit: 8,
      windowMs: 60_000,
      errorMsg: "You’re sending messages too fast. Please wait a moment.",
    });
  } catch (e) {
    return NextResponse.json({ error: e.message || "Rate limited" }, { status: e.status || 429 });
  }
  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json || {});
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", details: parsed.error.issues.map((i) => i.message) },
      { status: 400 }
    );
  }

  const { message, history = [] } = parsed.data;

  try {
    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      temperature: 0.4,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        ...history.slice(-8).map((m) => ({ role: m.role, content: m.content })),
        { role: "user", content: message },
      ],
    });

    const reply =
      completion?.choices?.[0]?.message?.content?.trim() ||
      "Happy to help, what’s your current goal or challenge?";
    return NextResponse.json({ ok: true, reply }, { status: 200 });
  } catch (e) {
    console.error("Career coach error:", e);
    return NextResponse.json({ error: "Coach unavailable" }, { status: 500 });
  }
}
