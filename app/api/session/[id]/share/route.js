// app/api/session/[id]/share/route.js
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { z } from "zod";
import crypto from "node:crypto";
import { auth } from "@clerk/nextjs/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import Session from "@/models/Session";

const patchSchema = z.object({
  enabled: z.boolean().optional(),
  includeNotes: z.boolean().optional(),
});

function buildPayload(session, origin) {
  const enabled = !!session?.share?.enabled;
  const includeNotes = !!session?.share?.includeNotes;
  const token = session?.share?.token || null;
  const url =
    enabled && token ? `${origin.replace(/\/$/, "")}/share/${token}` : "";
  return { enabled, includeNotes, token, url };
}

async function loadOwnedSession({ userId, id }) {
  await connectDB();
  const mongoUser = await User.findOne({ clerkId: userId }).lean();
  if (!mongoUser) return { error: "User not found", status: 404 };

  const session = await Session.findOne({
    _id: id,
    userId: mongoUser._id,
    $or: [{ deletedAt: null }, { deletedAt: { $exists: false } }],
  });
  if (!session) return { error: "Session not found", status: 404 };

  return { session };
}

// GET → current share settings (owner only)
export async function GET(req, ctx) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { params } = ctx || {};
  const { id } = (await params) || {};
  if (!id) return NextResponse.json({ error: "Missing session id" }, { status: 400 });

  const got = await loadOwnedSession({ userId, id });
  if ("error" in got) return NextResponse.json({ error: got.error }, { status: got.status });

  const origin = new URL(req.url).origin;
  const payload = buildPayload(got.session, origin);
  return NextResponse.json(payload);
}

// PATCH → toggle enable / includeNotes (owner only)
export async function PATCH(req, ctx) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { params } = ctx || {};
  const { id } = (await params) || {};
  if (!id) return NextResponse.json({ error: "Missing session id" }, { status: 400 });

  const body = await req.json().catch(() => ({}));
  const parsed = patchSchema.safeParse(body || {});
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.issues.map(i => i.message) },
      { status: 400 }
    );
  }

  const got = await loadOwnedSession({ userId, id });
  if ("error" in got) return NextResponse.json({ error: got.error }, { status: got.status });
  const session = got.session;

  const { enabled, includeNotes } = parsed.data;

  if (typeof enabled === "boolean") {
    session.share.enabled = enabled;
    // if enabling and there is no token yet, mint one
    if (enabled && !session.share.token) {
      session.share.token = crypto.randomUUID();
    }
  }
  if (typeof includeNotes === "boolean") {
    session.share.includeNotes = includeNotes;
  }

  await session.save();

  const origin = new URL(req.url).origin;
  const payload = buildPayload(session, origin);
  return NextResponse.json(payload);
}
