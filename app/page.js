import { Button } from "@/components/ui/button";
import Link from "next/link";
import PublicGallerySection from "@/components/public/PublicGallerySection";
export default function HomePage({searchParams}) {

  return (
    <section className="space-y-6">
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
        <h1 className="text-3xl font-semibold">InterviewForge</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Practice technical and behavioral interviews with AI, and explore public sessions.
        </p>
      </section>

      {/* NEW: Public gallery (no auth) */}
      <PublicGallerySection searchParams={searchParams} />
    </section>
  );
}
