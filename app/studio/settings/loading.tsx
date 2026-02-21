export default function SettingsLoading() {
  return (
    <div className="animate-pulse">
      <div className="mb-6">
        <div className="h-7 w-28 rounded-lg bg-muted mb-2" />
        <div className="h-4 w-48 rounded bg-muted" />
      </div>
      <div className="flex gap-2 mb-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-9 w-28 rounded-lg bg-muted" />
        ))}
      </div>
      <div className="rounded-xl border bg-white shadow-sm p-6 space-y-6">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="h-4 w-28 rounded bg-muted" />
            <div className="h-10 w-full rounded-lg bg-muted" />
          </div>
        ))}
        <div className="h-10 w-32 rounded-lg bg-muted" />
      </div>
    </div>
  );
}
