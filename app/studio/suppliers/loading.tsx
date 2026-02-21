export default function SuppliersLoading() {
  return (
    <div className="animate-pulse">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="h-7 w-28 rounded-lg bg-muted mb-2" />
          <div className="h-4 w-52 rounded bg-muted" />
        </div>
        <div className="h-10 w-32 rounded-lg bg-muted" />
      </div>
      <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
        <div className="p-4 border-b">
          <div className="h-10 w-64 rounded-lg bg-muted" />
        </div>
        <div className="divide-y">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-4">
              <div className="flex-1 space-y-2">
                <div className="h-4 w-40 rounded bg-muted" />
                <div className="h-3 w-56 rounded bg-muted" />
              </div>
              <div className="h-4 w-20 rounded bg-muted" />
              <div className="h-6 w-14 rounded-full bg-muted" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
