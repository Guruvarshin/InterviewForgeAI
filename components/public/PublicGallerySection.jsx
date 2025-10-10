// components/public/PublicGallerySection.jsx
import { connectDB } from "@/lib/db";
import Session from "@/models/Session";
import User from "@/models/User";
import PublicSessionCard from "./PublicSessionCard";
import Link from "next/link";
import { Button } from "@/components/ui/button";

function escapeRegex(s = "") {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export default async function PublicGallerySection({ sp = {} }) {
  await connectDB();

  // Normalize sp → strings (trimmed)
  const _sp = Object.fromEntries(
    Object.entries(sp).map(([k, v]) => [k, String(v ?? "").trim()])
  );

  // ---------- Base query: only shared & not deleted ----------
  const query = {
    "share.enabled": true,
    $or: [{ deletedAt: null }, { deletedAt: { $exists: false } }],
  };

  // ---------- Filters (User / Company / Role) ----------
  if (_sp.user) {
    const rx = new RegExp(escapeRegex(_sp.user), "i");
    const users = await User.find({ $or: [{ name: rx }, { email: rx }] })
      .select({ _id: 1 })
      .lean();

    // If no matching users, force zero results while keeping the filter UI visible.
    const userIds = users.map((u) => u._id);
    query.userId = { $in: userIds.length ? userIds : [null] };
  }

  if (_sp.company) {
    query.company = new RegExp(escapeRegex(_sp.company), "i");
  }
  if (_sp.role) {
    query.role = new RegExp(escapeRegex(_sp.role), "i");
  }

  // ---------- Fetch ----------
  const items = await Session.find(query)
    .sort({ createdAt: -1 })
    .limit(48)
    .lean();

  // Map user names for cards (even if empty → UI stays consistent)
  const uids = [...new Set(items.map((i) => String(i.userId)))];
  const usersById =
    uids.length > 0
      ? new Map(
          (
            await User.find({ _id: { $in: uids } })
              .select({ _id: 1, name: 1, email: 1 })
              .lean()
          ).map((u) => [String(u._id), u])
        )
      : new Map();

  const cards = items.map((i) => ({
    token: i?.share?.token,
    overall:
      typeof i?.scores?.overall === "number" ? Number(i.scores.overall) : null,
    role: i.role || "Software Engineer",
    company: i.company || "Company",
    jdText: i.jdText || "",
    turns: Array.isArray(i.transcript) ? i.transcript.length : 0,
    mode: i?.settings?.mode || "combo",
    createdAt: i.createdAt ? new Date(i.createdAt).toISOString() : null,
    userName:
      usersById.get(String(i.userId))?.name ||
      usersById.get(String(i.userId))?.email ||
      "User",
  }));

  // ---------- UI (filters ALWAYS visible) ----------
  return (
    <section className="mx-auto max-w-6xl space-y-4 px-4">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">Public Interviews</h2>
          <p className="text-sm text-muted-foreground">
            Shared by users, no sign-in required.
          </p>
        </div>

        {/* GET filter form → soft navigation via App Router */}
        <form action="/" method="get" className="flex flex-wrap items-end gap-2">
          <div>
            <label className="block text-xs text-muted-foreground">User</label>
            <input
              name="user"
              defaultValue={_sp.user || ""}
              className="h-9 rounded-md border bg-background px-2 text-sm"
              placeholder="Name or email"
            />
          </div>
          <div>
            <label className="block text-xs text-muted-foreground">Company</label>
            <input
              name="company"
              defaultValue={_sp.company || ""}
              className="h-9 rounded-md border bg-background px-2 text-sm"
              placeholder="e.g., Zoho"
            />
          </div>
          <div>
            <label className="block text-xs text-muted-foreground">Job title</label>
            <input
              name="role"
              defaultValue={_sp.role || ""}
              className="h-9 rounded-md border bg-background px-2 text-sm"
              placeholder="e.g., SDE"
            />
          </div>
          <Button type="submit" variant="outline" className="h-9">
            Filter
          </Button>
          <Link href="/">
            <Button type="button" className="h-9">
              Reset
            </Button>
          </Link>
        </form>
      </header>

      {/* Results or Empty State (filters remain above) */}
      {cards.length === 0 ? (
        <div className="rounded-2xl border p-8 text-center text-sm text-muted-foreground">
          No shared interviews match your filters.
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2">
          {cards.map((c) => (
            <PublicSessionCard key={c.token} item={c} />
          ))}
        </ul>
      )}
    </section>
  );
}
