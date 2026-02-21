export default function ShopLoading() {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header skeleton */}
      <div className="mb-8 animate-pulse">
        <div className="h-9 w-48 rounded-lg bg-muted" />
        <div className="mt-2 h-5 w-72 rounded bg-muted" />
      </div>

      {/* Filter bar skeleton */}
      <div className="mb-6 flex gap-3 animate-pulse">
        <div className="h-10 w-64 rounded-lg bg-muted" />
        <div className="h-10 w-32 rounded-lg bg-muted" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-10 w-20 rounded-full bg-muted" />
        ))}
      </div>

      {/* Product grid skeleton */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="animate-pulse rounded-xl border bg-muted/20 p-3"
          >
            <div className="mb-3 aspect-[3/4] rounded-lg bg-muted" />
            <div className="mb-2 h-4 w-3/4 rounded bg-muted" />
            <div className="h-4 w-1/2 rounded bg-muted" />
          </div>
        ))}
      </div>
    </div>
  );
}
