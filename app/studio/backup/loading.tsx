export default function BackupLoading() {
  return (
    <div className="animate-pulse">
      <div className="mb-6">
        <div className="h-7 w-24 rounded-lg bg-muted mb-2" />
        <div className="h-4 w-48 rounded bg-muted" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-xl border bg-white shadow-sm p-4 space-y-2">
            <div className="h-4 w-20 rounded bg-muted" />
            <div className="h-7 w-16 rounded bg-muted" />
          </div>
        ))}
      </div>
      <div className="rounded-xl border bg-white shadow-sm p-6 space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between p-4 rounded-lg border">
            <div className="space-y-2">
              <div className="h-4 w-32 rounded bg-muted" />
              <div className="h-3 w-48 rounded bg-muted" />
            </div>
            <div className="h-9 w-24 rounded-lg bg-muted" />
          </div>
        ))}
      </div>
    </div>
  );
}
