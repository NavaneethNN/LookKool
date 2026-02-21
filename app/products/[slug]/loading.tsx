export default function ProductLoading() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid gap-8 lg:grid-cols-2">
        {/* Image gallery skeleton */}
        <div className="animate-pulse">
          <div className="aspect-square rounded-2xl bg-muted" />
          <div className="mt-3 flex gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-16 w-16 rounded-lg bg-muted" />
            ))}
          </div>
        </div>

        {/* Product info skeleton */}
        <div className="animate-pulse space-y-4">
          <div className="h-5 w-24 rounded-full bg-muted" />
          <div className="h-8 w-3/4 rounded-lg bg-muted" />
          <div className="h-6 w-32 rounded bg-muted" />
          <div className="space-y-2">
            <div className="h-4 w-full rounded bg-muted" />
            <div className="h-4 w-5/6 rounded bg-muted" />
            <div className="h-4 w-2/3 rounded bg-muted" />
          </div>
          <div className="flex gap-2 pt-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-10 w-10 rounded-full bg-muted" />
            ))}
          </div>
          <div className="flex gap-2 pt-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-10 w-16 rounded-lg bg-muted" />
            ))}
          </div>
          <div className="flex gap-3 pt-6">
            <div className="h-12 flex-1 rounded-lg bg-muted" />
            <div className="h-12 w-12 rounded-lg bg-muted" />
          </div>
        </div>
      </div>
    </div>
  );
}
