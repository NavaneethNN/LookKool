export default function BarcodeLoading() {
  return (
    <div className="animate-pulse">
      <div className="mb-6">
        <div className="h-7 w-40 rounded-lg bg-muted mb-2" />
        <div className="h-4 w-64 rounded bg-muted" />
      </div>
      <div className="rounded-xl border bg-white shadow-sm p-6 space-y-6">
        <div className="h-10 w-full rounded-lg bg-muted" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="border rounded-lg p-4 space-y-3">
              <div className="h-16 w-full rounded bg-muted" />
              <div className="h-3 w-24 rounded bg-muted mx-auto" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
