export default function FeedLoading() {
  return (
    <div className="min-h-screen bg-nightcap page-with-nav">
      <div className="glass sticky top-0 z-10 border-b border-white/5 safe-area-pt h-14" />
      <main className="mx-auto max-w-3xl px-4 py-12">
        <div className="h-10 w-32 bg-white/5 rounded-lg animate-pulse mb-8" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="glass rounded-2xl p-6 animate-pulse">
              <div className="flex gap-4">
                <div className="w-24 h-24 rounded-xl bg-white/5" />
                <div className="flex-1 space-y-3">
                  <div className="h-6 w-48 bg-white/5 rounded" />
                  <div className="h-4 w-32 bg-white/5 rounded" />
                  <div className="h-4 w-24 bg-white/5 rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
