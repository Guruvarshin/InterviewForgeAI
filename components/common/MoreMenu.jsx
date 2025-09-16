"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function MoreMenu({ sessionId, archived = false, onChanged, buttonClassName = "" }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  async function patchArchive(next) {
    setBusy(true);
    try {
      const res = await fetch(`/api/session/${sessionId}/archive`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ archived: next }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data?.error || "Failed to update archive state");
      } else {
        toast.success(next ? "Archived" : "Unarchived");
        onChanged?.();
      }
    } catch (e) {
      console.error(e);
      toast.error("Network error");
    } finally {
      setBusy(false);
      setOpen(false);
    }
  }

  async function del() {
    if (!confirm("Permanently delete this session? This cannot be undone.")) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/session/${sessionId}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data?.error || "Delete failed");
      } else {
        toast.success("Session permanently deleted");
        onChanged?.();
      }
    } catch (e) {
      console.error(e);
      toast.error("Network error");
    } finally {
      setBusy(false);
      setOpen(false);
    }
  }

  return (
    <div className="relative">
      <Button
        type="button"
        variant="outline"
        className={buttonClassName}
        onClick={() => setOpen((v) => !v)}
        disabled={busy}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        More
      </Button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 z-20 mt-2 w-44 overflow-hidden rounded-md border bg-background shadow-md"
        >
          <button
            className="block w-full px-3 py-2 text-left text-sm hover:bg-muted"
            role="menuitem"
            onClick={() => patchArchive(!archived)}
            disabled={busy}
          >
            {archived ? "Unarchive" : "Archive"}
          </button>
          <button
            className="block w-full px-3 py-2 text-left text-sm text-rose-600 hover:bg-rose-50"
            role="menuitem"
            onClick={del}
            disabled={busy}
          >
            Delete
          </button>
        </div>
      )}
    </div>
  );
}
