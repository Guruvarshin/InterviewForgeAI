"use client";

import { useState, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function ViewMenu() {
  const router = useRouter();
  const sp = useSearchParams();
  const [open, setOpen] = useState(false);

  const currentView = (sp.get("view") || "active").toLowerCase();
  const qAll = useMemo(() => Object.fromEntries(sp.entries()), [sp]);

  function go(view) {
    const next = new URLSearchParams(qAll);
    if (view === "active") next.delete("view");
    else next.set("view", view);
    router.push(`/dashboard?${next.toString()}`);
    setOpen(false);
  }

  return (
    <div className="relative">
      <Button
        variant="outline"
        className="px-3"
        onClick={() => setOpen(v => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        title="View"
      >
        ☰
      </Button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 z-20 mt-2 w-44 overflow-hidden rounded-md border bg-background shadow-md"
          onMouseLeave={() => setOpen(false)}
        >
          {[
            ["active", "Active (default)"],
            ["archived", "Archived"],
            ["deleted", "Deleted"],
            ["all", "All"],
          ].map(([val, label]) => (
            <button
              key={val}
              role="menuitem"
              onClick={() => go(val)}
              className={`block w-full px-3 py-2 text-left text-sm hover:bg-muted ${
                currentView === val ? "font-semibold" : ""
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
