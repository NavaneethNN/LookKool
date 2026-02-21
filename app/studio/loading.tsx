export default function StudioLoading() {
  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar skeleton */}
      <div className="hidden w-64 animate-pulse border-r bg-white p-4 lg:block">
        <div className="mb-8 h-8 w-32 rounded bg-muted" />
        <div className="space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-9 w-full rounded-lg bg-muted" />
          ))}
        </div>
      </div>
      {/* Content skeleton */}
      <div className="flex-1 p-6 lg:p-8 animate-pulse">
        <div className="mb-6 h-8 w-48 rounded-lg bg-muted" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-xl border bg-white p-6">
              <div className="mb-2 h-4 w-24 rounded bg-muted" />
              <div className="h-8 w-20 rounded bg-muted" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
