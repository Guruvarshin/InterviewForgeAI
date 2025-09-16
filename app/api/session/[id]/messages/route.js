export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import Session from "@/models/Session";

export async function GET(_req, ctx) {
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

  const items = (session.transcript || []).map((t, i) => ({
    id: `${i}-${(t.ts && new Date(t.ts).getTime()) || i}`,
    role: t.speaker === "ai" ? "assistant" : "user",
    content: t.text,
    ts: t.ts,
  }));

  return NextResponse.json({ items }, { status: 200 });
}
