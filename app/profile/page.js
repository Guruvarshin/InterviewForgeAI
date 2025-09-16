import { requireAuth, getUser } from "@/lib/auth";

export default async function ProfilePage() {
  await requireAuth();
  const user = await getUser();

  return (
    <div className="space-y-2">
      <h1 className="text-2xl font-semibold tracking-tight">Your Profile</h1>
      <pre className="rounded-md border bg-background p-3 text-xs">
        {JSON.stringify(
          {
            id: user?.id,
            email: user?.emailAddresses?.[0]?.emailAddress,
            firstName: user?.firstName,
            lastName: user?.lastName,
          },
          null,
          2
        )}
      </pre>
    </div>
  );
}
