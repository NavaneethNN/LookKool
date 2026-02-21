export default function CategoryLoading() {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb skeleton */}
      <div className="mb-6 flex gap-2 animate-pulse">
        <div className="h-4 w-12 rounded bg-muted" />
        <div className="h-4 w-4 rounded bg-muted" />
        <div className="h-4 w-24 rounded bg-muted" />
      </div>

      {/* Header skeleton */}
      <div className="mb-8 animate-pulse">
        <div className="h-9 w-56 rounded-lg bg-muted" />
        <div className="mt-2 h-5 w-80 rounded bg-muted" />
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
