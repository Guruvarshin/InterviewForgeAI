import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function FiltersBar({ searchParams = {}, action = "/dashboard" }) {
  const q = String(searchParams.q || "");
  const company = String(searchParams.company || "");
  const role = String(searchParams.role || "");
  const mode = String(searchParams.mode || ""); // technical|general|combo
  const from = String(searchParams.from || "");
  const to = String(searchParams.to || "");
  const view = String(searchParams.view || "all"); // active|archived|all

  return (
    <form action={action} method="get" className="rounded-xl border bg-background/60 p-4">
      <div className="grid gap-3 md:grid-cols-4">
        <div className="md:col-span-2">
          <label className="block text-xs text-muted-foreground">Search</label>
          <input
            name="q"
            defaultValue={q}
            placeholder="Title, company, JD text…"
            className="mt-1 h-9 w-full rounded-md border bg-background px-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs text-muted-foreground">Company</label>
          <input
            name="company"
            defaultValue={company}
            className="mt-1 h-9 w-full rounded-md border bg-background px-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs text-muted-foreground">Role</label>
          <input
            name="role"
            defaultValue={role}
            className="mt-1 h-9 w-full rounded-md border bg-background px-2 text-sm"
          />
        </div>

        <div>
          <label className="block text-xs text-muted-foreground">Mode</label>
          <select
            name="mode"
            defaultValue={mode}
            className="mt-1 h-9 w-full rounded-md border bg-background px-2 text-sm"
          >
            <option value="">Any</option>
            <option value="technical">Technical</option>
            <option value="general">General</option>
            <option value="combo">Combination</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-muted-foreground">From</label>
          <input
            type="date"
            name="from"
            defaultValue={from}
            className="mt-1 h-9 w-full rounded-md border bg-background px-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs text-muted-foreground">To</label>
          <input
            type="date"
            name="to"
            defaultValue={to}
            className="mt-1 h-9 w-full rounded-md border bg-background px-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs text-muted-foreground">View</label>
          <select
            name="view"
            defaultValue={view}
            className="mt-1 h-9 w-full rounded-md border bg-background px-2 text-sm"
          >
            <option value="active">Active</option>
            <option value="archived">Archived</option>
            <option value="all">All</option>
          </select>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Button type="submit">Apply</Button>
        <Link href="/dashboard">
          <Button type="button" variant="outline">Reset</Button>
        </Link>
      </div>
    </form>
  );
}
