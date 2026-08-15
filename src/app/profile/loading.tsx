export default function ProfileLoading() {
  return (
    <div className="min-h-screen bg-nightcap page-with-nav">
      <div className="glass sticky top-0 z-10 border-b border-white/5 safe-area-pt h-14" />
      <main className="mx-auto max-w-2xl px-4 py-8 animate-pulse space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-full bg-white/5" />
          <div className="space-y-2">
            <div className="h-6 w-32 bg-white/5 rounded" />
            <div className="h-4 w-48 bg-white/5 rounded" />
          </div>
        </div>
        <div className="h-24 bg-white/5 rounded-2xl" />
        <div className="h-24 bg-white/5 rounded-2xl" />
      </main>
    </div>
  );
}
