// components/session/ShareControls.jsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function ShareControls({ sessionId }) {
  const [enabled, setEnabled] = useState(false);
  const [includeNotes, setIncludeNotes] = useState(false);
  const [token, setToken] = useState(null);
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(true);

  // load initial
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch(`/api/session/${sessionId}/share`, { cache: "no-store" });
        const j = await res.json();
        if (!res.ok) throw new Error(j?.error || "Failed to load share settings");
        if (!alive) return;
        setEnabled(!!j.enabled);
        setIncludeNotes(!!j.includeNotes);
        setToken(j.token || null);
        setUrl(j.url || "");
      } catch (e) {
        toast.error(e.message || "Share load failed");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [sessionId]);

  async function patch(next) {
    setLoading(true);
    try {
      const res = await fetch(`/api/session/${sessionId}/share`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(next),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j?.error || "Update failed");
      setEnabled(!!j.enabled);
      setIncludeNotes(!!j.includeNotes);
      setToken(j.token || null);
      setUrl(j.url || "");
      toast.success("Share settings updated");
    } catch (e) {
      toast.error(e.message || "Network error");
    } finally {
      setLoading(false);
    }
  }

  async function copy() {
    if (!url) return toast.error("Enable share first");
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied");
    } catch {
      toast.error("Copy failed");
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        type="button"
        variant={enabled ? "secondary" : "outline"}
        disabled={loading}
        onClick={() => patch({ enabled: !enabled })}
        title={enabled ? "Disable share" : "Enable share"}
      >
        {enabled ? "Shared" : "Share"}
      </Button>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={includeNotes}
          onChange={(e) => patch({ includeNotes: e.target.checked })}
          disabled={loading || !enabled}
        />
        Share notes
      </label>

      <Button type="button" variant="outline" disabled={!enabled || !url || loading} onClick={copy}>
        Copy link
      </Button>
    </div>
  );
}
