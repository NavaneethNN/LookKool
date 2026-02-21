export default function ProductDetailLoading() {
  return (
    <div className="animate-pulse">
      <div className="h-4 w-32 rounded bg-muted mb-4" />
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="h-7 w-64 rounded-lg bg-muted mb-2" />
          <div className="h-4 w-48 rounded bg-muted" />
        </div>
        <div className="flex gap-2">
          <div className="h-9 w-24 rounded-lg bg-muted" />
          <div className="h-9 w-24 rounded-lg bg-muted" />
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border bg-white shadow-sm p-4">
            <div className="h-3 w-20 rounded bg-muted mb-2" />
            <div className="h-8 w-12 rounded bg-muted" />
          </div>
        ))}
      </div>
      <div className="rounded-xl border bg-white shadow-sm p-6 space-y-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="h-4 w-24 rounded bg-muted" />
            <div className="h-10 w-full rounded-lg bg-muted" />
          </div>
        ))}
      </div>
    </div>
  );
}
