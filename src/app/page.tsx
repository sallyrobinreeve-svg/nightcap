import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/feed");
  }

  return (
    <div className="min-h-screen bg-nightcap flex flex-col items-center justify-center px-4">
      <div className="text-center max-w-md">
        <h1 className="font-display text-6xl gradient-text mb-4">
          NightCapt
        </h1>
        <p className="text-xl text-nightcap-muted mb-12">
          Every good night deserves a recap. The social diary where nights live on.
        </p>
        <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
          <Link
            href="/auth/signin"
            className="rounded-full bg-nightcap-accent px-8 py-4 font-medium text-white transition hover:scale-105 hover:shadow-lg hover:shadow-nightcap-accent/30"
          >
            Sign in with phone
          </Link>
          <Link
            href="/auth/signup"
            className="rounded-full glass px-8 py-4 font-medium text-white transition hover:border-nightcap-accent/50"
          >
            Create account
          </Link>
        </div>
        <Link
          href="/privacy"
          className="mt-12 inline-block text-sm text-nightcap-muted hover:text-nightcap-accent transition"
        >
          Terms, Privacy & Support
        </Link>
      </div>
    </div>
  );
}
