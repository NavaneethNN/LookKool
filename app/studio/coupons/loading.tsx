export default function CouponsLoading() {
  return (
    <div className="animate-pulse">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="h-7 w-28 rounded-lg bg-muted mb-2" />
          <div className="h-4 w-24 rounded bg-muted" />
        </div>
        <div className="h-10 w-32 rounded-lg bg-muted" />
      </div>
      <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
        <div className="divide-y">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-6 py-4">
              <div className="h-5 w-24 rounded bg-muted font-mono" />
              <div className="h-4 w-20 rounded bg-muted" />
              <div className="h-4 w-28 rounded bg-muted flex-1" />
              <div className="h-4 w-16 rounded bg-muted" />
              <div className="h-6 w-14 rounded-full bg-muted" />
              <div className="h-8 w-20 rounded-lg bg-muted" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
