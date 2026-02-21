export default function OrderDetailLoading() {
  return (
    <div className="animate-pulse">
      <div className="h-4 w-28 rounded bg-muted mb-4" />
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="h-7 w-40 rounded-lg bg-muted mb-2" />
          <div className="h-4 w-56 rounded bg-muted" />
        </div>
        <div className="flex gap-2">
          <div className="h-7 w-20 rounded-full bg-muted" />
          <div className="h-7 w-20 rounded-full bg-muted" />
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-xl border bg-white shadow-sm p-6">
            <div className="h-5 w-28 rounded bg-muted mb-4" />
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex gap-4">
                  <div className="h-16 w-16 rounded-lg bg-muted shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-48 rounded bg-muted" />
                    <div className="h-3 w-32 rounded bg-muted" />
                  </div>
                  <div className="h-4 w-16 rounded bg-muted" />
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="space-y-6">
          <div className="rounded-xl border bg-white shadow-sm p-6 space-y-3">
            <div className="h-5 w-24 rounded bg-muted" />
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-4 w-full rounded bg-muted" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
