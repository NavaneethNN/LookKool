export default function InventoryLoading() {
  return (
    <div className="animate-pulse">
      <div className="mb-6">
        <div className="h-7 w-28 rounded-lg bg-muted mb-2" />
        <div className="h-4 w-64 rounded bg-muted" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border bg-white shadow-sm p-4 space-y-2">
            <div className="h-4 w-20 rounded bg-muted" />
            <div className="h-7 w-28 rounded bg-muted" />
          </div>
        ))}
      </div>
      <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
        <div className="p-4 border-b flex gap-3">
          <div className="h-10 w-64 rounded-lg bg-muted" />
          <div className="h-10 w-32 rounded-lg bg-muted" />
        </div>
        <div className="divide-y">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-4">
              <div className="flex-1 space-y-2">
                <div className="h-4 w-40 rounded bg-muted" />
                <div className="h-3 w-24 rounded bg-muted" />
              </div>
              <div className="h-4 w-16 rounded bg-muted" />
              <div className="h-6 w-14 rounded-full bg-muted" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
