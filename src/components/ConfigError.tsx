import Link from "next/link";

export function ConfigError() {
  return (
    <div className="min-h-screen bg-nightcap flex flex-col items-center justify-center px-6 text-center">
      <h1 className="font-display text-3xl text-white mb-3">NightCapt can’t connect</h1>
      <p className="text-nightcap-muted max-w-md mb-6">
        This build is missing configuration (Supabase URL or key). If you’re the developer, set{" "}
        <code className="text-nightcap-accent text-sm">NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
        <code className="text-nightcap-accent text-sm">NEXT_PUBLIC_SUPABASE_ANON_KEY</code>{" "}
        in your host (e.g. Vercel) and redeploy.
      </p>
      <Link href="/" className="text-nightcap-accent hover:underline">
        Try again
      </Link>
    </div>
  );
}
