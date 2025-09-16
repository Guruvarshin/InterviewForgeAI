import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="mx-auto my-24 max-w-md text-center">
      <h2 className="mb-2 text-xl font-semibold">Page not found</h2>
      <p className="mb-6 text-sm text-muted-foreground">
        The page you’re looking for doesn’t exist.
      </p>
      <Button asChild>
        <Link href="/">Go home</Link>
      </Button>
    </div>
  );
}
