"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function GlobalError({ error, reset }) {
  useEffect(() => {
    if (error) console.error(error);
  }, [error]);

  return (
    <div className="mx-auto my-24 max-w-md text-center">
      <h2 className="mb-2 text-xl font-semibold">Something went wrong</h2>
      <p className="mb-6 text-sm text-muted-foreground">
        An unexpected error occurred. Try reloading the page.
      </p>
      <div className="flex items-center justify-center gap-2">
        <Button onClick={() => reset()}>Try again</Button>
        <Button variant="outline" onClick={() => window.location.reload()}>
          Reload
        </Button>
      </div>
    </div>
  );
}
