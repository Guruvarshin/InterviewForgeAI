// components/common/ShareToggle.jsx
"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function ShareToggle({ sessionId }) {
  const [enabled, setEnabled] = useState(false);
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch(`/api/session/${sessionId}/share`, { cache: "no-store" });
        const j = await res.json();
        if (!res.ok) throw new Error(j?.error || "Failed to load share");
        if (!alive) return;
        setEnabled(!!j.enabled);
        setUrl(j.url || "");
      } catch (e) {
        toast.error(e.message || "Share load failed");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [sessionId]);

  async function toggle(next) {
    setLoading(true);
    try {
      const res = await fetch(`/api/session/${sessionId}/share`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: next }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j?.error || "Share update failed");
      setEnabled(!!j.enabled);
      setUrl(j.url || "");
      toast.success(j.enabled ? "Sharing enabled" : "Sharing disabled");
    } catch (e) {
      toast.error(e.message || "Network error");
    } finally {
      setLoading(false);
    }
  }

  async function copy() {
    if (!url) return;
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
        onClick={() => toggle(!enabled)}
      >
        {enabled ? "Shared" : "Share"}
      </Button>
      {enabled && url && (
        <Button type="button" variant="outline" onClick={copy}>
          Copy link
        </Button>
      )}
    </div>
  );
}
