export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import PublicGallerySection from "@/components/public/PublicGallerySection";

export default async function HomePage({ searchParams }) {
  const sp = (await searchParams) || {};

  return (
    <main className="space-y-6">
      <h1 className="text-4xl font-bold tracking-tight">Ace your next interview</h1>
      <p className="text-muted-foreground">
        Practice with an AI hiring manager tailored to your role, resume, and job description.
      </p>

      <div className="flex gap-3">
        <Button asChild size="lg">
          <Link href="/session/new">Start practicing</Link>
        </Button>
        <Button asChild variant="outline" size="lg">
          <Link href="/dashboard">View dashboard</Link>
        </Button>
      </div>

      <section className="mx-auto max-w-6xl px-4 py-10">
        <h2 className="text-3xl font-semibold">InterviewForge</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Practice technical and behavioral interviews with AI, and explore public sessions.
        </p>
      </section>

      {/* Public gallery (no auth) — pass sp, not searchParams */}
      <PublicGallerySection sp={sp} />
    </main>
  );
}
