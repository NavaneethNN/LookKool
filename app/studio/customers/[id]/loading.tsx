export default function CustomerDetailLoading() {
  return (
    <div className="animate-pulse">
      <div className="h-4 w-32 rounded bg-muted mb-4" />
      <div className="mb-6">
        <div className="h-7 w-48 rounded-lg bg-muted mb-2" />
        <div className="h-4 w-56 rounded bg-muted" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="rounded-xl border bg-white shadow-sm p-6 space-y-4">
          <div className="h-5 w-20 rounded bg-muted" />
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex justify-between">
              <div className="h-4 w-20 rounded bg-muted" />
              <div className="h-4 w-32 rounded bg-muted" />
            </div>
          ))}
        </div>
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-xl border bg-white shadow-sm p-6 space-y-4">
            <div className="h-5 w-32 rounded bg-muted" />
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-16 w-full rounded-lg bg-muted" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
