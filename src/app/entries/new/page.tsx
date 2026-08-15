import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { EntryWizard } from "@/components/EntryWizard";

export default async function NewEntryPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/signin");
  }

  return (
    <div className="min-h-screen bg-nightcap">
      <nav className="glass sticky top-0 z-10 border-b border-white/5">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Link href="/" className="font-display text-2xl text-night-accent">
            NightCapt
          </Link>
        </div>
      </nav>

      <main className="mx-auto max-w-2xl px-4 py-12">
        <h1 className="font-display text-4xl text-white mb-2">New entry</h1>
        <p className="text-night-muted mb-8">
          Log last night&apos;s adventure – photos, prompts, and your journey.
        </p>
        <EntryWizard userId={user.id} />
      </main>
    </div>
  );
}
