import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

/**
 * Use at the top of a SERVER page or layout.
 * Redirects to /sign-in if not authenticated.
 */
export async function requireAuth() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");
  return userId;
}

/**
 * Use in API route handlers to retrieve the userId (or return 401 yourself).
 */
export async function getUserId() {
  const { userId } = await auth();
  return userId || null;
}

/**
 * Get the full Clerk user (server-only) when you need profile data.
 * Returns null if not authenticated.
 */
export async function getUser() {
  try {
    const user = await currentUser();
    return user || null;
  } catch {
    return null;
  }
}
