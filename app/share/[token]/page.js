export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import Link from "next/link";
import { connectDB } from "@/lib/db";
import Session from "@/models/Session";
import { Button } from "@/components/ui/button";

function ScoreRing({ score }) {
  const val = typeof score === "number" ? Math.max(0, Math.min(10, score)) : null;
  const deg = val != null ? (val / 10) * 360 : 0;
  const color = val == null ? "#e5e7eb" : val >= 7 ? "#10B981" : val >= 5 ? "#F59E0B" : "#F43F5E";
  const ring =
    val == null
      ? "conic-gradient(#e5e7eb 0deg 360deg)"
      : `conic-gradient(${color} 0deg ${deg}deg, #e5e7eb ${deg}deg 360deg)`;
  const textClass =
    val == null ? "text-zinc-500" : val >= 7 ? "text-emerald-600" : val >= 5 ? "text-amber-600" : "text-rose-600";
  return (
    <div className="relative grid size-20 place-items-center">
      <div className="relative size-20 rounded-full" style={{ backgroundImage: ring }}>
        <div className="absolute inset-[6px] grid place-items-center rounded-full border bg-background">
          <span className={`text-base font-semibold ${textClass}`}>{val != null ? val.toFixed(1) : "—"}</span>
        </div>
      </div>
    </div>
  );
}

function CategoryGrid({ categories }) {
  if (!categories || typeof categories !== "object") return null;
  const items = Object.entries(categories);
  return (
    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
      {items.map(([k, v]) => (
        <div key={k} className="rounded-lg border p-3">
          <p className="text-xs capitalize text-muted-foreground">{k.replace(/_/g, " ")}</p>
          <p className="text-lg font-semibold">{typeof v === "number" ? v : "—"}/10</p>
        </div>
      ))}
    </div>
  );
}

export default async function SharePage({ params }) {
  const { token } = await params;

  await connectDB();
  const doc = await Session.findOne({
    "share.token": token,
    "share.enabled": true,
    $or: [{ deletedAt: null }, { deletedAt: { $exists: false } }],
  }).lean();

  if (!doc) notFound();

  const id = String(doc._id);
  const role = doc.role || "Software Engineer";
  const company = doc.company || "Company";
  const when = doc.createdAt ? new Date(doc.createdAt).toLocaleString() : "";
  const mode = doc?.settings?.mode || "combo";
  const overall = doc?.scores?.overall ?? null;
  const categories = doc?.scores?.categories || null;
  const transcript = Array.isArray(doc.transcript) ? doc.transcript : [];
  const jdSnippet = (doc.jdText || "").replace(/\s+/g, " ").trim();
  const showNotes = !!doc?.share?.includeNotes && !!doc?.notes;

  // tokenized export links
  const tokenQS = `?token=${encodeURIComponent(token)}`;
  const pdfUrl = `/api/session/${id}/export${tokenQS}`;
  const txtUrl = `/api/session/${id}/export${tokenQS}&format=txt`.replace("export?token", "export?format=txt&token");
  const jsonUrl = `/api/session/${id}/export${tokenQS}&format=json`.replace("export?token", "export?format=json&token");

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-8">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <ScoreRing score={overall} />
          <div>
            <p className="text-xs text-muted-foreground">{when}</p>
            <h1 className="text-xl font-semibold">
              {role} @ {company}
            </h1>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
              <span className="inline-flex items-center rounded-full border bg-zinc-50 px-2 py-0.5 text-zinc-700">
                {mode}
              </span>
              <span className="inline-flex items-center rounded-full border bg-zinc-50 px-2 py-0.5 text-zinc-700">
                {transcript.length} turn{transcript.length === 1 ? "" : "s"}
              </span>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <a href={pdfUrl}>
            <Button variant="outline">Export PDF</Button>
          </a>
          <a href={txtUrl}>
            <Button variant="outline">Export TXT</Button>
          </a>
          <a href={jsonUrl}>
            <Button variant="outline">Export JSON</Button>
          </a>
        </div>
      </header>

      {jdSnippet && (
        <section className="rounded-xl border p-4">
          <h2 className="mb-2 text-sm font-medium">Job Description (summary)</h2>
          <p className="text-sm text-muted-foreground">{jdSnippet}</p>
        </section>
      )}

      <section className="rounded-xl border p-4">
        <h2 className="mb-3 text-sm font-medium">Scores</h2>
        {categories ? (
          <CategoryGrid categories={categories} />
        ) : (
          <p className="text-sm text-muted-foreground">No evaluation yet.</p>
        )}
      </section>

      {showNotes && (
        <section className="rounded-xl border p-4">
          <h2 className="mb-3 text-sm font-medium">Notes</h2>
          <p className="whitespace-pre-wrap text-sm">{doc.notes}</p>
        </section>
      )}

      <section className="rounded-xl border p-4">
        <h2 className="mb-3 text-sm font-medium">Transcript (read-only)</h2>
        <div className="space-y-2">
          {transcript.length === 0 && <p className="text-sm text-muted-foreground">No messages yet.</p>}
          {transcript.map((t, i) => (
            <div
              key={i}
              className={`rounded-md border p-2 text-sm ${t.speaker === "ai" ? "bg-muted" : "bg-background"}`}
            >
              <p className="mb-1 font-medium">{t.speaker === "ai" ? "AI" : "Candidate"}</p>
              <p className="whitespace-pre-wrap">{t.text}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="flex items-center justify-between">
        <Link href="/">
          <Button variant="ghost">InterviewForge</Button>
        </Link>
        <p className="text-xs text-muted-foreground">
          Shared view, notes {showNotes ? "included" : "hidden"} by owner settings.
        </p>
      </footer>
    </div>
  );
}
