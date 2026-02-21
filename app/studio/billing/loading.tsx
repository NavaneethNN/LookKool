export default function BillingLoading() {
  return (
    <div className="animate-pulse">
      <div className="mb-6">
        <div className="h-7 w-24 rounded-lg bg-muted mb-2" />
        <div className="h-4 w-56 rounded bg-muted" />
      </div>
      <div className="rounded-xl border bg-white shadow-sm p-6 space-y-6">
        <div className="h-10 w-full rounded-lg bg-muted" />
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-4 rounded-lg border border-dashed">
              <div className="h-10 w-10 rounded bg-muted" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-40 rounded bg-muted" />
                <div className="h-3 w-24 rounded bg-muted" />
              </div>
              <div className="h-4 w-16 rounded bg-muted" />
            </div>
          ))}
        </div>
        <div className="h-12 w-full rounded-lg bg-muted" />
      </div>
    </div>
  );
}
