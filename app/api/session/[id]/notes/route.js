export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@clerk/nextjs/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import Session from "@/models/Session";

const bodySchema = z.object({ notes: z.string().max(20000).default("") });

export async function PATCH(req, ctx) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { params } = ctx || {};
  const { id } = (await params) || {};
  if (!id) return NextResponse.json({ error: "Missing session id" }, { status: 400 });

  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json || {});
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.issues.map((i) => i.message) },
      { status: 400 }
    );
  }

  await connectDB();
  const mongoUser = await User.findOne({ clerkId: userId }).lean();
  if (!mongoUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const s = await Session.findOne({ _id: id, userId: mongoUser._id });
  if (!s) return NextResponse.json({ error: "Session not found" }, { status: 404 });

  s.notes = parsed.data.notes;
  s.notesUpdatedAt = new Date();
  await s.save();

  return NextResponse.json({ ok: true }, { status: 200 });
}
