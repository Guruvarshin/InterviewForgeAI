export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { z } from "zod";
import { auth, currentUser } from "@clerk/nextjs/server";

import { connectDB } from "@/lib/db";
import User from "@/models/User";
import Session from "@/models/Session";
import { extractTextFromFormDataFile } from "@/lib/pdf/parseResume";

const MAX_PDF_MB = 5;
const PDF_LIMIT = MAX_PDF_MB * 1024 * 1024;

const bodySchema = z.object({
  role: z.string().min(2, "Job Title is required"),     // ← added
  company: z.string().min(2, "Company is required"),
  jdText: z.string().min(30, "Paste a job description (min 30 chars)"),
  mode: z.enum(["technical", "general", "combo"]).optional(),
});

export async function POST(req) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const form = await req.formData();
  const role = String(form.get("role") || "");           // ← added
  const company = String(form.get("company") || "");
  const jdText = String(form.get("jdText") || "");
  const modeRaw = form.get("mode");
  const mode =
    modeRaw && typeof modeRaw === "string" && ["technical", "general", "combo"].includes(modeRaw)
      ? modeRaw
      : undefined;

  const parsed = bodySchema.safeParse({ role, company, jdText, mode });
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.issues.map((i) => i.message) },
      { status: 400 }
    );
  }

  // Resume (optional)
  let resumeText = "";
  const resume = form.get("resume");
  if (resume && typeof resume === "object" && "arrayBuffer" in resume) {
    const type = resume.type || "";
    const size = Number(resume.size || 0);
    if (type !== "application/pdf") {
      return NextResponse.json({ error: "Resume must be a PDF" }, { status: 400 });
    }
    if (size > PDF_LIMIT) {
      return NextResponse.json({ error: `PDF exceeds ${MAX_PDF_MB}MB` }, { status: 400 });
    }
    try {
      const { text } = await extractTextFromFormDataFile(resume);
      resumeText = text || "";
    } catch (e) {
      console.warn("Resume PDF parse failed:", e?.message || e);
      resumeText = "";
    }
  }

  // Ensure Mongo user
  await connectDB();
  let mongoUser = await User.findOne({ clerkId: userId });
  if (!mongoUser) {
    const cu = await currentUser().catch(() => null);
    const email =
      cu?.emailAddresses?.[0]?.emailAddress || cu?.primaryEmailAddress?.emailAddress || "";
    const name =
      [cu?.firstName, cu?.lastName].filter(Boolean).join(" ") ||
      (email.split("@")[0] || "User");
    mongoUser = await User.findOneAndUpdate(
      { clerkId: userId },
      { clerkId: userId, email, name },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  }

  // Initial AI message
  const initialTranscript = [];
  const settingsMode = mode ?? "pending";
  if (!mode) {
    initialTranscript.push({
      speaker: "ai",
      text:
        "Before we start: would you like a technical, general, or a combination interview? " +
        "Reply with one of: technical / general / combination.",
      ts: new Date(),
    });
  } else {
    initialTranscript.push({
      speaker: "ai",
      text: `Great — we’ll run a ${mode} interview. Ready to begin?`,
      ts: new Date(),
    });
  }

  // Save with provided role
  const doc = await Session.create({
    userId: mongoUser._id,
    role,                 // ← use the role from the form
    company,
    jdText,
    resumeText,
    settings: {
      persona: "tough-but-fair",
      difficulty: "normal",
      timeboxSec: 90,
      mode: settingsMode,
      voice: { mode: "vapi", pace: "normal" },
    },
    transcript: initialTranscript,
    flow: { topic: "", followups: 0, askedTopics: [] },
  });

  return NextResponse.json({ id: doc.id }, { status: 201 });
}
