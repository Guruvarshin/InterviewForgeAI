export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import Session from "@/models/Session";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

function sanitizeFileName(s = "") {
  return s.replace(/[^\w\-]+/g, "_").slice(0, 80) || "session";
}

function sessionToPlain(session) {
  return {
    id: String(session._id),
    createdAt: session.createdAt,
    updatedAt: session.updatedAt,
    role: session.role,
    company: session.company,
    settings: session.settings || {},
    jdText: session.jdText || "",
    resumeText: session.resumeText || "",
    notes: session.notes || "",
    scores: session.scores || null,
    feedback: session.feedback || null,
    transcript: Array.isArray(session.transcript)
      ? session.transcript.map((t) => ({ speaker: t.speaker, text: t.text, ts: t.ts }))
      : [],
  };
}

function buildTxt(session) {
  const s = sessionToPlain(session);
  const lines = [];
  lines.push(`${s.role} @ ${s.company}`);
  lines.push(`Created: ${new Date(s.createdAt).toLocaleString()}`);
  lines.push("");
  if (s.scores?.overall != null) {
    lines.push(`Overall: ${s.scores.overall}/10`);
    if (s.scores?.categories) {
      lines.push("Categories:");
      for (const [k, v] of Object.entries(s.scores.categories)) {
        lines.push(`  - ${k.replace(/_/g, " ")}: ${v}/10`);
      }
      lines.push("");
    }
  }
  if (s.notes) {
    lines.push("Notes:");
    lines.push(s.notes);
    lines.push("");
  }
  lines.push("Transcript:");
  for (const t of s.transcript) {
    const who = t.speaker === "ai" ? "AI" : "You";
    lines.push(`${who}: ${t.text}`);
  }
  return lines.join("\n");
}

async function buildPdf(session) {
  const s = sessionToPlain(session);

  const pdf = await PDFDocument.create();
  let page = pdf.addPage([595.28, 841.89]); // A4
  const margin = 48;
  let y = page.getSize().height - margin;

  const fontRegular = await pdf.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold);

  function addPage() {
    page = pdf.addPage([595.28, 841.89]);
    y = page.getSize().height - margin;
  }

  function drawText(text, opts = {}) {
    const {
      size = 12,
      color = rgb(0, 0, 0),
      bold = false,
      leading = 4,
      maxWidth = page.getSize().width - margin * 2,
    } = opts;
    const font = bold ? fontBold : fontRegular;

    // word wrap
    const words = String(text).split(/\s+/);
    let line = "";
    const lines = [];
    for (const w of words) {
      const next = line ? line + " " + w : w;
      const wWidth = font.widthOfTextAtSize(next, size);
      if (wWidth > maxWidth && line) {
        lines.push(line);
        line = w;
      } else {
        line = next;
      }
    }
    if (line) lines.push(line);
    if (lines.length === 0) lines.push("");

    for (const ln of lines) {
      if (y - size < margin) addPage();
      page.drawText(ln, { x: margin, y: y - size, size, font, color });
      y -= size + leading;
    }
  }

  // Title
  drawText(`${s.role} @ ${s.company}`, { size: 20, bold: true, leading: 8 });
  drawText(`Created: ${new Date(s.createdAt).toLocaleString()}`, {
    size: 10,
    color: rgb(0.35, 0.35, 0.35),
  });
  y -= 6;

  // Scores
  if (s.scores?.overall != null) {
    drawText(`Overall: ${s.scores.overall}/10`, { size: 14, bold: true, leading: 10 });
    if (s.scores?.categories) {
      for (const [k, v] of Object.entries(s.scores.categories)) {
        drawText(`${k.replace(/_/g, " ")}: ${v}/10`, { size: 12 });
      }
    }
    y -= 6;
  }

  // Notes
  if (s.notes) {
    drawText("Notes", { size: 14, bold: true, leading: 8 });
    drawText(s.notes, { size: 12 });
    y -= 6;
  }

  // JD (brief)
  if (s.jdText) {
    drawText("Job Description (summary)", { size: 14, bold: true, leading: 8 });
    drawText(s.jdText.slice(0, 1600), { size: 12 }); // keep file small
    y -= 6;
  }

  // Transcript
  drawText("Transcript", { size: 14, bold: true, leading: 8 });
  for (const t of s.transcript) {
    const who = t.speaker === "ai" ? "AI" : "You";
    drawText(`${who}: ${t.text}`, { size: 12 });
  }

  const bytes = await pdf.save();
  return Buffer.from(bytes);
}

export async function GET(req, ctx) {
  const url = new URL(req.url);
  const format = (url.searchParams.get("format") || "pdf").toLowerCase();

  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { params } = ctx || {};
  const { id } = (await params) || {};
  if (!id) return NextResponse.json({ error: "Missing session id" }, { status: 400 });

  await connectDB();
  const mongoUser = await User.findOne({ clerkId: userId }).lean();
  if (!mongoUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const session = await Session.findOne({ _id: id, userId: mongoUser._id }).lean();
  if (!session) return NextResponse.json({ error: "Session not found" }, { status: 404 });

  const base = sanitizeFileName(
    `${session.role || "Software_Engineer"}_${session.company || "Company"}`
  );

  try {
    if (format === "json") {
      const json = JSON.stringify(sessionToPlain(session), null, 2);
      return new NextResponse(json, {
        status: 200,
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "Content-Disposition": `attachment; filename="${base}.json"`,
        },
      });
    }

    if (format === "txt") {
      const txt = buildTxt(session);
      return new NextResponse(txt, {
        status: 200,
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Content-Disposition": `attachment; filename="${base}.txt"`,
        },
      });
    }

    const pdfBuffer = await buildPdf(session);
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${base}.pdf"`,
        "Content-Length": String(pdfBuffer.length),
      },
    });
  } catch (e) {
    console.error("Export error:", e);
    return NextResponse.json({ error: "Export failed" }, { status: 500 });
  }
}
