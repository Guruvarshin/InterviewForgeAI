"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function ExportMenu({ sessionId, label = "Export", buttonClassName = "" }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <Button
        type="button"
        variant="outline"
        className={buttonClassName}
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        {label}
      </Button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-20 mt-2 w-40 overflow-hidden rounded-md border bg-background shadow-md"
          onMouseLeave={() => setOpen(false)}
        >
          <a href={`/api/session/${sessionId}/export`} className="block px-3 py-2 text-sm hover:bg-muted" role="menuitem">
            PDF
          </a>
          <a href={`/api/session/${sessionId}/export?format=txt`} className="block px-3 py-2 text-sm hover:bg-muted" role="menuitem">
            TXT
          </a>
          <a href={`/api/session/${sessionId}/export?format=json`} className="block px-3 py-2 text-sm hover:bg-muted" role="menuitem">
            JSON
          </a>
        </div>
      )}
    </div>
  );
}
