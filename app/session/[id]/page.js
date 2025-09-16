export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { auth } from "@clerk/nextjs/server";
import { notFound, redirect } from "next/navigation";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import Session from "@/models/Session";

import ExportMenu from "@/components/common/ExportMenu";
import ShareControls from "@/components/session/ShareControls";
import ChatClient from "@/components/session/chat-client";
import ReviewPanel from "@/components/session/review-panel";

export default async function InterviewPage({ params }) {
  const { id } = (await params) || {};
  if (!id) notFound();

  // Auth (server-side)
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  // DB
  await connectDB();
  const mongoUser = await User.findOne({ clerkId: userId }).lean();
  if (!mongoUser) redirect("/new");

  const session = await Session.findOne({ _id: id, userId: mongoUser._id }).lean();
  if (!session) redirect("/dashboard");

  // Plain chat history for client
  const initialMessages = Array.isArray(session.transcript)
    ? session.transcript.map((t, idx) => ({
        id: `${idx}-${(t.ts && new Date(t.ts).getTime()) || idx}`,
        role: t.speaker === "ai" ? "assistant" : "user",
        content: t.text,
      }))
    : [];

  return (
    <section className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">
            {(session.role || "Software Engineer")} @ {session.company || "Company"}
          </h1>
          {session.createdAt && (
            <p className="text-xs text-muted-foreground">
              {new Date(session.createdAt).toLocaleString()}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          <ExportMenu sessionId={String(session._id)} />
          <ShareControls sessionId={String(session._id)} />
        </div>
      </header>

      <ChatClient
        sessionId={String(session._id)}
        initialMessages={initialMessages}
        initialNotes={session.notes || ""}
      />

      <ReviewPanel sessionId={String(session._id)} />
    </section>
  );
}
