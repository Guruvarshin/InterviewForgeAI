// components/dashboard/SessionCard.jsx
"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import ExportMenu from "@/components/common/ExportMenu";
import MoreMenu from "@/components/common/MoreMenu";
import { toast } from "sonner";

// ---- score → colors helper (no DOM access, safe on SSR) ----
function toneForScore(score) {
  if (score == null) {
    return {
      ringHex: "#e5e7eb",
      textClass: "text-zinc-500",
      chipClass: "bg-zinc-50 border-zinc-200 text-zinc-700",
    };
  }
  if (score >= 7) {
    return {
      ringHex: "#10B981",
      textClass: "text-emerald-600",
      chipClass: "bg-emerald-50 border-emerald-200 text-emerald-700",
    };
  }
  if (score >= 5) {
    return {
      ringHex: "#F59E0B",
      textClass: "text-amber-600",
      chipClass: "bg-amber-50 border-amber-200 text-amber-700",
    };
  }
  return {
    ringHex: "#F43F5E",
    textClass: "text-rose-600",
    chipClass: "bg-rose-50 border-rose-200 text-rose-700",
  };
}

export default function SessionCard({ session }) {
  const router = useRouter();

  const id = String(session.id || session._id);
  const score =
    typeof session?.scores?.overall === "number" ? Number(session.scores.overall) : null;
  const mode = session?.settings?.mode || "pending";
  const turns =
    typeof session.transcriptCount === "number"
      ? session.transcriptCount
      : Array.isArray(session.transcript)
      ? session.transcript.length
      : 0;
  const when = session.createdAt ? new Date(session.createdAt).toLocaleString() : "";
  const jdSnippet =
    (session.jdText || "").replace(/\s+/g, " ").trim().slice(0, 150) +
    ((session.jdText || "").length > 150 ? "…" : "");

  const tone = toneForScore(score);
  const deg = score != null ? Math.max(0, Math.min(360, (score / 10) * 360)) : 0;
  const ringBg =
    score == null
      ? "conic-gradient(#e5e7eb 0deg 360deg)"
      : `conic-gradient(${tone.ringHex} 0deg ${deg}deg, #e5e7eb ${deg}deg 360deg)`;

  // ---- share state seeded from server, no GET on mount ----
  const [shareEnabled, setShareEnabled] = useState(!!session?.share?.enabled);
  const [token, setToken] = useState(session?.share?.token || null);
  const [shareUrl, setShareUrl] = useState(""); // will be filled after first PATCH success
  const [shareMenuOpen, setShareMenuOpen] = useState(false);
  const [shareBusy, setShareBusy] = useState(false);

  // Build URL locally if API didn’t send one yet (first render)
  const localUrl = useMemo(() => {
    if (!token || typeof window === "undefined") return "";
    return `${window.location.origin}/share/${token}`;
  }, [token]);

  async function patchShare(nextEnabled) {
    setShareBusy(true);
    try {
      const res = await fetch(`/api/session/${id}/share`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: nextEnabled }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j?.error || "Share update failed");

      // API returns { enabled, includeNotes, token, url }
      setShareEnabled(!!j.enabled);
      setToken(j.token || null);
      setShareUrl(j.url || "");

      toast.success(j.enabled ? "Sharing enabled" : "Sharing disabled");
    } catch (e) {
      toast.error(e.message || "Network error");
    } finally {
      setShareBusy(false);
    }
  }

  function copyLink() {
    const urlToCopy = shareUrl || localUrl;
    if (!urlToCopy) return;
    navigator.clipboard?.writeText(urlToCopy).then(
      () => {
        toast.success("Link copied");
        setShareMenuOpen(false);
      },
      () => toast.error("Copy failed")
    );
  }

  return (
    <li className="rounded-2xl border bg-background/60 p-4 shadow-sm transition-all hover:shadow-md">
      <div className="grid gap-4 md:grid-cols-[1fr,220px]">
        {/* LEFT */}
        <div className="min-w-0">
          <div className="flex items-center gap-4">
            <div className="relative grid size-16 shrink-0 place-items-center">
              <div className="relative size-16 rounded-full" style={{ backgroundImage: ringBg }}>
                <div className="absolute inset-[4px] grid place-items-center rounded-full border bg-background">
                  <span className={`text-sm font-semibold ${tone.textClass}`}>
                    {score != null ? score.toFixed(1) : "—"}
                  </span>
                </div>
              </div>
            </div>

            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">{when}</p>
              <h3 className="truncate text-base font-semibold">
                {session.role || "Software Engineer"} @ {session.company || "Company"}
              </h3>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                <span
                  className={`inline-flex items-center rounded-full border px-2 py-0.5 ${
                    mode === "technical"
                      ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                      : mode === "general"
                      ? "bg-blue-50 border-blue-200 text-blue-700"
                      : mode === "combo"
                      ? "bg-violet-50 border-violet-200 text-violet-700"
                      : "bg-zinc-50 border-zinc-200 text-zinc-700"
                  }`}
                >
                  {mode}
                </span>
                <span className="inline-flex items-center rounded-full border bg-zinc-50 px-2 py-0.5 text-zinc-700">
                  {turns} turn{turns === 1 ? "" : "s"}
                </span>
                {score != null && (
                  <span
                    className={`inline-flex items-center rounded-full border px-2 py-0.5 ${tone.chipClass}`}
                  >
                    overall {score.toFixed(1)}/10
                  </span>
                )}
              </div>
            </div>
          </div>

          {jdSnippet && (
            <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">{jdSnippet}</p>
          )}
        </div>

        {/* RIGHT */}
        <div className="md:ml-auto md:w-[220px] md:self-start">
          <Link href={`/session/${id}`} className="block">
            <Button className="w-full">Open</Button>
          </Link>

          <div className="mt-2 grid grid-cols-3 gap-2">
            <ExportMenu sessionId={id} buttonClassName="w-full" />

            <Button
              type="button"
              variant={shareEnabled ? "secondary" : "outline"}
              className="w-full"
              disabled={shareBusy}
              onClick={() => patchShare(!shareEnabled)}
              title={shareEnabled ? "Disable share" : "Enable share"}
            >
              {shareEnabled ? "Shared" : "Share"}
            </Button>

            <div className="relative">
              <Button
                type="button"
                variant="outline"
                className="w-full"
                disabled={!shareEnabled || shareBusy}
                onClick={() => setShareMenuOpen((v) => !v)}
                aria-haspopup="menu"
                aria-expanded={shareMenuOpen}
                title="Share options"
              >
                ⋮
              </Button>
              {shareEnabled && shareMenuOpen && (
                <div
                  role="menu"
                  className="absolute right-0 z-20 mt-2 w-52 overflow-hidden rounded-md border bg-background shadow-md"
                  onMouseLeave={() => setShareMenuOpen(false)}
                >
                  <button
                    className="block w-full px-3 py-2 text-left text-sm hover:bg-muted"
                    role="menuitem"
                    onClick={copyLink}
                  >
                    Copy public link
                  </button>
                  {(shareUrl || localUrl) && (
                    <a
                      href={shareUrl || localUrl}
                      className="block px-3 py-2 text-sm hover:bg-muted"
                      role="menuitem"
                      target="_blank"
                      rel="noreferrer"
                    >
                      Open public view
                    </a>
                  )}
                  <button
                    className="block w-full px-3 py-2 text-left text-sm hover:bg-muted"
                    role="menuitem"
                    onClick={() => {
                      setShareMenuOpen(false);
                      patchShare(false);
                    }}
                  >
                    Disable share
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="mt-2">
            <MoreMenu
              sessionId={id}
              archived={!!session.archived}
              onChanged={() => router.refresh()}
              buttonClassName="w-full"
            />
          </div>
        </div>
      </div>
    </li>
  );
}
