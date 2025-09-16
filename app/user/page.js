export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { UserProfile } from "@clerk/nextjs";

export default async function UserPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-4 text-xl font-semibold">Manage account</h1>
      <div className="rounded-xl border bg-background p-4">
        {/* Clerk hosted profile UI */}
        <UserProfile path="/user" routing="path" />
      </div>
    </div>
  );
}
