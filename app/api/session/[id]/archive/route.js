// app/api/session/[id]/archive/route.js
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@clerk/nextjs/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import Session from "@/models/Session";

const bodySchema = z.object({
  archived: z.boolean(),
});

export async function PATCH(req, ctx) {
  // Auth
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Params (Next 15: await params)
  const { params } = ctx || {};
  const { id } = (await params) || {};
  if (!id) return NextResponse.json({ error: "Missing session id" }, { status: 400 });

  // Body
  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json || {});
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.issues.map(i => i.message) },
      { status: 400 }
    );
  }
  const { archived } = parsed.data;

  // DB + ownership
  await connectDB();
  const mongoUser = await User.findOne({ clerkId: userId }).lean();
  if (!mongoUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const session = await Session.findOne({ _id: id, userId: mongoUser._id });
  if (!session) return NextResponse.json({ error: "Session not found" }, { status: 404 });

  // Update
  session.archived = archived;
  if (!Array.isArray(session.activity)) session.activity = [];
  session.activity.push({ action: archived ? "archived" : "unarchived", at: new Date(), meta: null });
  await session.save();

  return NextResponse.json({ ok: true, archived }, { status: 200 });
}
