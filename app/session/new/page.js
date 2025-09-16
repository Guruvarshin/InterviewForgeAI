export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import NewSessionForm from "@/components/session/NewSessionForm";

export default async function NewPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  return (
    <section className="mx-auto max-w-3xl space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Create a new interview</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Provide your target <strong>Job Title</strong>, company, JD, and (optionally) upload your resume PDF.
        </p>
      </header>

      <NewSessionForm />
    </section>
  );
}
