import Link from "next/link";
import { Button } from "@/components/ui/button";

function ringStyle(score) {
  if (score == null) return ["conic-gradient(#e5e7eb 0deg 360deg)", "text-zinc-500"];
  const deg = Math.max(0, Math.min(360, (score / 10) * 360));
  const color = score >= 7 ? "#10B981" : score >= 5 ? "#F59E0B" : "#F43F5E";
  const txt = score >= 7 ? "text-emerald-600" : score >= 5 ? "text-amber-600" : "text-rose-600";
  return [`conic-gradient(${color} 0deg ${deg}deg, #e5e7eb ${deg}deg 360deg)`, txt];
}

export default function PublicSessionCard({ item }) {
  const [bg, txt] = ringStyle(item.overall);
  const when = item.createdAt ? new Date(item.createdAt).toLocaleString() : "";
  const snippet =
    (item.jdText || "").replace(/\s+/g, " ").trim().slice(0, 180) +
    ((item.jdText || "").length > 180 ? "…" : "");

  return (
    <li className="rounded-2xl border bg-background/60 p-4 shadow-sm transition-all hover:shadow-md">
      <div className="grid gap-4 md:grid-cols-[1fr,180px]">
        {/* LEFT */}
        <div className="min-w-0">
          <div className="flex items-center gap-4">
            <div className="relative grid size-16 place-items-center">
              <div className="relative size-16 rounded-full" style={{ backgroundImage: bg }}>
                <div className="absolute inset-[4px] grid place-items-center rounded-full border bg-background">
                  <span className={`text-sm font-semibold ${txt}`}>{item.overall ?? "—"}</span>
                </div>
              </div>
            </div>

            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">{when}</p>
              <h3 className="truncate text-base font-semibold">
                {item.role} @ {item.company}
              </h3>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                <span className="inline-flex items-center rounded-full border bg-zinc-50 px-2 py-0.5 text-zinc-700">
                  {item.userName}
                </span>
                <span className={`inline-flex items-center rounded-full border px-2 py-0.5 ${
                  item.mode === "technical" ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                    : item.mode === "general" ? "bg-blue-50 border-blue-200 text-blue-700"
                    : "bg-violet-50 border-violet-200 text-violet-700"
                }`}>
                  {item.mode}
                </span>
                <span className="inline-flex items-center rounded-full border bg-zinc-50 px-2 py-0.5 text-zinc-700">
                  {item.turns} turn{item.turns === 1 ? "" : "s"}
                </span>
              </div>
            </div>
          </div>

          {snippet && <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">{snippet}</p>}
        </div>

        {/* RIGHT */}
        <div className="md:ml-auto md:w-[180px] md:self-start">
          <Link href={`/share/${item.token}`} className="block">
            <Button className="w-full">Open</Button>
          </Link>
        </div>
      </div>
    </li>
  );
}
