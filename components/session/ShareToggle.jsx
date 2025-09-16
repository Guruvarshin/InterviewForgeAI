"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function ShareToggle({ sessionId, appUrl = "" }) {
  const [enabled, setEnabled] = useState(false);
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/session/${sessionId}/share`, { cache: "no-store" });
        const j = await res.json();
        if (res.ok) {
          setEnabled(!!j.enabled);
          if (j.token) setUrl(`${appUrl || window.location.origin}/share/${j.token}`);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [sessionId, appUrl]);

  async function toggle(next) {
    setLoading(true);
    try {
      const res = await fetch(`/api/session/${sessionId}/share`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: next }),
      });
      const j = await res.json();
      if (res.ok) {
        setEnabled(j.enabled);
        setUrl(j.url || "");
        toast.success(j.enabled ? "Sharing enabled" : "Sharing disabled");
      } else {
        toast.error(j?.error || "Share update failed");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  }

  function copy() {
    if (!url) return;
    navigator.clipboard.writeText(url).then(() => toast.success("Link copied"));
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        type="button"
        variant={enabled ? "secondary" : "outline"}
        disabled={loading}
        onClick={() => toggle(!enabled)}
      >
        {enabled ? "Disable share" : "Enable share"}
      </Button>
      {enabled && url && (
        <>
          <input
            readOnly
            value={url}
            className="min-w-[220px] flex-1 rounded-md border bg-background p-2 text-sm"
          />
          <Button type="button" variant="outline" onClick={copy}>Copy link</Button>
        </>
      )}
    </div>
  );
}
