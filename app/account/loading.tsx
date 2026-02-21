export default function AccountLoading() {
  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <div className="animate-pulse space-y-6">
        <div className="h-9 w-40 rounded-lg bg-muted" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-xl border p-6">
              <div className="mb-3 h-10 w-10 rounded-lg bg-muted" />
              <div className="mb-2 h-5 w-28 rounded bg-muted" />
              <div className="h-4 w-44 rounded bg-muted" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
