export default function ReportsLoading() {
  return (
    <div className="animate-pulse">
      <div className="mb-6">
        <div className="h-7 w-24 rounded-lg bg-muted mb-2" />
        <div className="h-4 w-56 rounded bg-muted" />
      </div>
      <div className="flex gap-2 mb-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-9 w-24 rounded-lg bg-muted" />
        ))}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border bg-white shadow-sm p-4 space-y-2">
            <div className="h-4 w-20 rounded bg-muted" />
            <div className="h-7 w-28 rounded bg-muted" />
          </div>
        ))}
      </div>
      <div className="rounded-xl border bg-white shadow-sm p-6">
        <div className="h-64 w-full rounded-lg bg-muted" />
      </div>
    </div>
  );
}
