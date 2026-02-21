export default function Loading() {
  return (
    <div className="container mx-auto px-4 py-20">
      <div className="mx-auto max-w-3xl text-center animate-pulse">
        {/* Hero skeleton */}
        <div className="mx-auto mb-6 h-7 w-48 rounded-full bg-muted" />
        <div className="mx-auto mb-4 h-12 w-full max-w-lg rounded-lg bg-muted" />
        <div className="mx-auto mb-8 h-6 w-96 rounded-lg bg-muted" />
        <div className="flex justify-center gap-4">
          <div className="h-12 w-36 rounded-lg bg-muted" />
          <div className="h-12 w-36 rounded-lg bg-muted" />
        </div>
      </div>

      {/* Category grid skeleton */}
      <div className="mt-20 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="flex animate-pulse flex-col items-center rounded-2xl border bg-muted/30 p-8"
          >
            <div className="mb-4 h-14 w-14 rounded-xl bg-muted" />
            <div className="h-5 w-24 rounded bg-muted" />
          </div>
        ))}
      </div>

      {/* Product strip skeleton */}
      <div className="mt-16 space-y-4">
        <div className="h-7 w-40 rounded bg-muted animate-pulse" />
        <div className="flex gap-4 overflow-hidden">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="min-w-[200px] flex-shrink-0 animate-pulse rounded-xl border bg-muted/30 p-4"
            >
              <div className="mb-3 aspect-square rounded-lg bg-muted" />
              <div className="mb-2 h-4 w-3/4 rounded bg-muted" />
              <div className="h-4 w-1/2 rounded bg-muted" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
