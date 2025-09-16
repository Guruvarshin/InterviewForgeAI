// app/dashboard/loading.js
export default function Loading() {
  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4">
      <div className="h-7 w-48 animate-pulse rounded-md bg-zinc-200/60" />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-2xl border p-4">
            <div className="flex gap-4">
              <div className="h-16 w-16 animate-pulse rounded-full bg-zinc-200/60" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-2/3 animate-pulse rounded bg-zinc-200/60" />
                <div className="h-4 w-1/2 animate-pulse rounded bg-zinc-200/60" />
                <div className="h-3 w-full animate-pulse rounded bg-zinc-200/60" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
