export default function CartLoading() {
  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <div className="animate-pulse">
        <div className="mb-8 h-9 w-36 rounded-lg bg-muted" />
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex gap-4 rounded-xl border p-4">
              <div className="h-24 w-24 flex-shrink-0 rounded-lg bg-muted" />
              <div className="flex-1 space-y-2">
                <div className="h-5 w-3/4 rounded bg-muted" />
                <div className="h-4 w-1/3 rounded bg-muted" />
                <div className="h-4 w-1/4 rounded bg-muted" />
              </div>
            </div>
          ))}
        </div>
        <div className="mt-8 ml-auto w-72 space-y-3 rounded-xl border p-6">
          <div className="h-5 w-full rounded bg-muted" />
          <div className="h-5 w-full rounded bg-muted" />
          <div className="h-12 w-full rounded-lg bg-muted" />
        </div>
      </div>
    </div>
  );
}
