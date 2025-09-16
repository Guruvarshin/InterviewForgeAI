"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function ShareControls({
  sessionId,
  initial = { enabled: false, includeNotes: false, token: null },
}) {
  const [enabled, setEnabled] = useState(!!initial.enabled);
  const [includeNotes, setIncludeNotes] = useState(!!initial.includeNotes);
  const [token, setToken] = useState(initial.token);

  // Build public URL client-side when token exists
  const url = useMemo(() => {
    if (!token) return "";
    if (typeof window === "undefined") return "";
    return `${window.location.origin}/share/${token}`;
  }, [token]);

  async function patch(next) {
    try {
      const res = await fetch(`/api/session/${sessionId}/share`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(next),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Update failed");
      // server is source of truth
      setEnabled(!!data?.share?.enabled);
      setIncludeNotes(!!data?.share?.includeNotes);
      setToken(data?.share?.token || null);
      toast.success("Share settings updated");
    } catch (e) {
      toast.error(e.message || "Network error");
    }
  }

  function copy() {
    if (!url) return toast.error("Enable share first");
    navigator.clipboard.writeText(url).then(
      () => toast.success("Link copied"),
      () => toast.error("Copy failed")
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        type="button"
        variant={enabled ? "secondary" : "outline"}
        onClick={() => patch({ enabled: !enabled, includeNotes })}
        title={enabled ? "Disable share" : "Enable share"}
      >
        {enabled ? "Shared" : "Share"}
      </Button>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={includeNotes}
          onChange={(e) => patch({ enabled, includeNotes: e.target.checked })}
          disabled={!enabled}
        />
        Share notes
      </label>

      <Button type="button" variant="outline" disabled={!enabled || !url} onClick={copy}>
        Copy link
      </Button>
    </div>
  );
}
