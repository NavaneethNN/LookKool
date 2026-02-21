export default function CustomersLoading() {
  return (
    <div className="animate-pulse">
      <div className="mb-6">
        <div className="h-7 w-32 rounded-lg bg-muted mb-2" />
        <div className="h-4 w-36 rounded bg-muted" />
      </div>
      <div className="mb-6">
        <div className="h-10 w-64 rounded-lg bg-muted" />
      </div>
      <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
        <div className="divide-y">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-6 py-4">
              <div className="h-10 w-10 rounded-full bg-muted shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-36 rounded bg-muted" />
                <div className="h-3 w-48 rounded bg-muted" />
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
