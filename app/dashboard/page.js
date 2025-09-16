export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import Session from "@/models/Session";
import FiltersBar from "@/components/dashboard/FiltersBar";
import SessionCard from "@/components/dashboard/SessionCard";

function toISO(d) { try { return new Date(d).toISOString(); } catch { return null; } }

function toCardDTO(s) {
  return {
    id: String(s._id),
    role: s.role || "Software Engineer",
    company: s.company || "Company",
    createdAt: s.createdAt ? new Date(s.createdAt).toISOString() : null,
    jdText: s.jdText || "",
    settings: { mode: s?.settings?.mode || "pending" },
    transcriptCount: Array.isArray(s.transcript) ? s.transcript.length : 0,
    scores: { overall: typeof s?.scores?.overall === "number" ? Number(s.scores.overall) : null },
    archived: !!s.archived,
  };
}

export default async function DashboardPage({ searchParams }) {
  const sp = (await searchParams) || {};
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  await connectDB();
  const user = await User.findOne({ clerkId: userId }).lean();
  if (!user) redirect("/new");

  // Base query by view
  const view = String(sp.view || "all");
  const query = { userId: user._id };
  if (view === "active") {
    query.archived = false;
    query.$or = [{ deletedAt: null }, { deletedAt: { $exists: false } }];
  } else if (view === "archived") {
    query.archived = true;
    query.$or = [{ deletedAt: null }, { deletedAt: { $exists: false } }];
  } else if (view === "deleted") {
    query.deletedAt = { $ne: null };
  } // 'all' shows everything

  // Filters
  const { q, company, role, mode, from, to } = Object.fromEntries(
    Object.entries(sp).map(([k, v]) => [k, String(v || "")])
  );

  if (company) query.company = new RegExp(company.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
  if (role) query.role = new RegExp(role.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
  if (mode) query["settings.mode"] = mode;

  const fromISO = from && toISO(from);
  const toISOv = to && toISO(to);
  if (fromISO || toISOv) {
    query.createdAt = {};
    if (fromISO) query.createdAt.$gte = new Date(fromISO);
    if (toISOv) query.createdAt.$lte = new Date(toISOv);
  }

  // Basic text search across a few fields
  if (q) {
    const rx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    query.$or = [
      ...(query.$or || []),
      { company: rx },
      { role: rx },
      { jdText: rx },
      { resumeText: rx },
    ];
  }

  const docs = await Session.find(query).sort({ createdAt: -1 }).limit(60).lean();

  // Include share state here so cards don't fetch on mount
  const items = docs.map((d) => ({
    id: String(d._id),
    role: d.role,
    company: d.company,
    jdText: d.jdText,
    scores: d.scores || null,
    settings: d.settings || {},
    transcriptCount: Array.isArray(d.transcript) ? d.transcript.length : 0,
    archived: !!d.archived,
    createdAt: d.createdAt?.toISOString() || null,
    share: {
      enabled: !!d?.share?.enabled,
      includeNotes: !!d?.share?.includeNotes,
      token: d?.share?.token || null,
    },
  }));

  // Metrics (doesn't need share)
  const sessions = items.map(toCardDTO);
  const reviewed = sessions.filter((s) => typeof s?.scores?.overall === "number").length;
  const avg =
    reviewed > 0
      ? (sessions.reduce((acc, s) => acc + (s.scores.overall || 0), 0) / reviewed).toFixed(1)
      : "—";

  return (
    <div className="mx-auto max-w-6xl space-y-5 px-4 py-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Dashboard</h1>
        {/* If you keep the hamburger to view archived/deleted, it maps to ?view=archived|deleted */}
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border p-4">
          <p className="text-xs text-muted-foreground">Sessions</p>
          <p className="text-xl font-semibold">{sessions.length}</p>
        </div>
        <div className="rounded-xl border p-4">
          <p className="text-xs text-muted-foreground">Reviewed</p>
          <p className="text-xl font-semibold">{reviewed}</p>
        </div>
        <div className="rounded-xl border p-4">
          <p className="text-xs text-muted-foreground">Avg Overall</p>
          <p className="text-xl font-semibold">{avg}</p>
        </div>
      </div>

      <FiltersBar searchParams={sp} action="/dashboard" />

      <ul className="grid gap-4 md:grid-cols-2">
        {items.length === 0 && (
          <li className="col-span-full rounded-xl border p-8 text-center text-sm text-muted-foreground">
            No sessions match your filters.
          </li>
        )}
        {items.map((s) => (
          <SessionCard key={s.id} session={s} />
        ))}
      </ul>
    </div>
  );
}
