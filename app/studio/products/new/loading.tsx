export default function NewProductLoading() {
  return (
    <div className="animate-pulse">
      <div className="inline-flex items-center gap-1.5 mb-4">
        <div className="h-4 w-4 rounded bg-muted" />
        <div className="h-4 w-28 rounded bg-muted" />
      </div>
      <div className="mb-6">
        <div className="h-7 w-32 rounded-lg bg-muted mb-2" />
      </div>
      <div className="rounded-xl border bg-white shadow-sm p-6 space-y-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="h-4 w-28 rounded bg-muted" />
            <div className="h-10 w-full rounded-lg bg-muted" />
          </div>
        ))}
        <div className="h-40 w-full rounded-lg bg-muted" />
        <div className="h-10 w-32 rounded-lg bg-muted" />
      </div>
    </div>
  );
}
