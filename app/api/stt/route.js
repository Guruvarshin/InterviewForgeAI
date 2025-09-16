export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import Groq, { toFile } from "groq-sdk";
import { assertRateLimit, getClientIP, rateKey } from "@/lib/rateLimit";
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const STT_MODEL = process.env.GROQ_STT_MODEL || "whisper-large-v3";

// Max ~25MB per Groq docs (free tier limit); clamp here to be safe
const MAX_AUDIO_BYTES = 25 * 1024 * 1024;

export async function POST(req) {
  try {
    const ip = getClientIP(req);
    assertRateLimit({
      key: rateKey(["stt", ip]),
      limit: 6,
      windowMs: 60_000,
      errorMsg: "Too many transcriptions per minute.",
    });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: e.status || 429 });
  }
  // Require auth
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Parse multipart/form-data
  const form = await req.formData();
  const file = form.get("audio");
  if (!file || typeof file !== "object" || !("arrayBuffer" in file)) {
    return NextResponse.json({ error: "Missing audio file" }, { status: 400 });
  }

  // Basic type/size checks
  const type = String(file.type || "");
  const okTypes = ["audio/webm", "audio/wav", "audio/mpeg", "audio/mp4", "audio/ogg"];
  if (!okTypes.includes(type)) {
    return NextResponse.json({ error: `Unsupported audio type: ${type}` }, { status: 400 });
  }
  const size = Number(file.size || 0);
  if (size <= 0 || size > MAX_AUDIO_BYTES) {
    return NextResponse.json({ error: "Audio too large (max 25MB)" }, { status: 400 });
  }

  // Convert to Web File for groq-sdk
  const buf = Buffer.from(await file.arrayBuffer());
  const webFile = await toFile(buf, file.name || "audio.webm", { type });

  try {
    const res = await groq.audio.transcriptions.create({
      model: STT_MODEL,              // e.g., whisper-large-v3
      file: webFile,
      response_format: "json",
      temperature: 0,                // more deterministic transcripts
    });

    const text =
      res?.text?.trim?.() ||
      res?.segments?.map?.((s) => s.text)?.join(" ")?.trim() ||
      "";

    return NextResponse.json({ ok: true, text });
  } catch (err) {
    const status = err?.status || 500;
    const msg = status === 429 ? "STT rate limit — try again shortly." : "STT error";
    console.error("Groq STT error:", err);
    return NextResponse.json({ error: msg }, { status });
  }
}
