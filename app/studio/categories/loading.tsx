export default function CategoriesLoading() {
  return (
    <div className="animate-pulse">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="h-7 w-32 rounded-lg bg-muted mb-2" />
          <div className="h-4 w-24 rounded bg-muted" />
        </div>
        <div className="h-10 w-36 rounded-lg bg-muted" />
      </div>
      <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
        <div className="divide-y">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-6 py-4">
              <div className="h-4 w-8 rounded bg-muted" />
              <div className="h-10 w-10 rounded-lg bg-muted" />
              <div className="flex-1 h-4 w-32 rounded bg-muted" />
              <div className="h-4 w-24 rounded bg-muted" />
              <div className="h-6 w-14 rounded-full bg-muted" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
