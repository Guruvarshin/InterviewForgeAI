export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { z } from "zod";
import crypto from "crypto";
import { auth } from "@clerk/nextjs/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import Session from "@/models/Session";

const patchSchema = z.object({
  enabled: z.boolean().optional(),
  includeNotes: z.boolean().optional(),
});

function resp(urlOrigin, s) {
  const enabled = !!s?.share?.enabled;
  const token = s?.share?.token || null;
  return {
    enabled,
    includeNotes: !!s?.share?.includeNotes,
    token,
    url: enabled && token ? `${urlOrigin}/share/${token}` : null,
  };
}

export async function GET(req, ctx) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { params } = ctx || {};
  const { id } = (await params) || {};
  if (!id) return NextResponse.json({ error: "Missing session id" }, { status: 400 });

  await connectDB();
  const mongoUser = await User.findOne({ clerkId: userId }).lean();
  if (!mongoUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const s = await Session.findOne({ _id: id, userId: mongoUser._id }).lean();
  if (!s) return NextResponse.json({ error: "Session not found" }, { status: 404 });

  const origin = new URL(req.url).origin;
  return NextResponse.json(resp(origin, s), { status: 200 });
}

export async function PATCH(req, ctx) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { params } = ctx || {};
  const { id } = (await params) || {};
  if (!id) return NextResponse.json({ error: "Missing session id" }, { status: 400 });

  const json = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(json || {});
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.issues.map((i) => i.message) },
      { status: 400 }
    );
  }
  const { enabled, includeNotes } = parsed.data;

  await connectDB();
  const mongoUser = await User.findOne({ clerkId: userId }).lean();
  if (!mongoUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const s = await Session.findOne({ _id: id, userId: mongoUser._id });
  if (!s) return NextResponse.json({ error: "Session not found" }, { status: 404 });

  if (typeof enabled === "boolean") {
    s.share.enabled = enabled;
    if (enabled && !s.share.token) {
      s.share.token = crypto.randomUUID().replace(/-/g, "").slice(0, 24);
    }
  }
  if (typeof includeNotes === "boolean") {
    s.share.includeNotes = includeNotes;
  }

  await s.save();

  const origin = new URL(req.url).origin;
  return NextResponse.json(resp(origin, s), { status: 200 });
}
