export default function ResultsLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto w-[min(112rem,calc(100%-1.5rem))] px-3 py-10 sm:px-5">
        <div className="rounded-2xl border border-stone-200/90 bg-white p-6 shadow-lg shadow-black/5 sm:p-8">
          <div className="mb-6 flex items-center gap-3">
            <div className="h-10 w-10 animate-pulse rounded-full bg-primary/30" />
            <div className="space-y-2">
              <div className="h-4 w-36 animate-pulse rounded bg-stone-200" />
              <div className="h-3 w-56 animate-pulse rounded bg-stone-100" />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {Array.from({ length: 4 }, (_, i) => (
              <div
                key={i}
                className="space-y-3 rounded-2xl border border-stone-200/80 bg-stone-50/70 p-5"
              >
                <div className="h-4 w-24 animate-pulse rounded bg-stone-200" />
                <div className="h-5 w-3/4 animate-pulse rounded bg-stone-200" />
                <div className="h-3 w-full animate-pulse rounded bg-stone-100" />
                <div className="h-3 w-5/6 animate-pulse rounded bg-stone-100" />
                <div className="h-2 w-full animate-pulse rounded bg-stone-200" />
                <div className="h-9 w-28 animate-pulse rounded-full bg-primary/30" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
