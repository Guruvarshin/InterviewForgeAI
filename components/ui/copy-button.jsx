"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function CopyButton({ getText, children = "Copy" }) {
  const [busy, setBusy] = useState(false);

  return (
    <Button
      variant="outline"
      size="sm"
      disabled={busy}
      onClick={async () => {
        try {
          setBusy(true);
          const text = typeof getText === "function" ? getText() : String(getText ?? "");
          await navigator.clipboard.writeText(text);
          toast.success("Copied to clipboard");
        } catch (e) {
          toast.error("Failed to copy");
        } finally {
          setBusy(false);
        }
      }}
    >
      {children}
    </Button>
  );
}
