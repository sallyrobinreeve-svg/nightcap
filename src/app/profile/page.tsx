import Link from "next/link";
import { redirect } from "next/navigation";
import { SafeImage } from "@/components/SafeImage";
import { formatPhoneForDisplay } from "@/lib/phone";
import { createClient } from "@/lib/supabase/server";
import { BottomNav } from "@/components/BottomNav";
import { DeleteAccountButton } from "@/components/DeleteAccountButton";

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/signin");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, avatar_url, bio")
    .eq("id", user.id)
    .maybeSingle();

  const { count } = await supabase
    .from("entries")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id);

  const { data: stats } = await supabase
    .from("user_stats")
    .select("total_entries, avg_rating, kiss_count, missions_completed, top_club_name, top_club_visits")
    .eq("user_id", user.id)
    .maybeSingle();

  const s = stats || {
    total_entries: 0,
    avg_rating: null as number | null,
    kiss_count: 0,
    missions_completed: 0,
    top_club_name: null as string | null,
    top_club_visits: 0,
  };

  return (
    <div className="min-h-screen bg-nightcap pb-24">
      <nav className="glass sticky top-0 z-10 border-b border-white/5">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Link href="/" className="font-display text-2xl text-nightcap-accent">
            NightCapt
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/feed" className="text-nightcap-muted hover:text-white transition">
              Feed
            </Link>
            <Link href="/friends" className="text-nightcap-muted hover:text-white transition">
              Friends
            </Link>
            <Link href="/leaderboard" className="text-nightcap-muted hover:text-white transition">
              Leaderboard
            </Link>
            <Link href="/entries" className="text-nightcap-muted hover:text-white transition">
              Entries
            </Link>
            <Link
              href="/entries/new"
              className="rounded-full bg-nightcap-accent px-5 py-2.5 font-medium text-white transition hover:opacity-90"
            >
              New Entry
            </Link>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-2xl px-4 py-12">
        <div className="glass rounded-2xl p-8">
          <div className="flex items-start gap-6">
            <Link
              href="/profile/edit"
              className="relative w-24 h-24 rounded-full overflow-hidden bg-nightcap-muted flex-shrink-0 block group"
            >
              {profile?.avatar_url ? (
                <SafeImage
                  src={profile.avatar_url}
                  alt="Profile"
                  fill
                  className="object-cover"
                  fallbackLetter={(profile?.display_name || "?")[0]}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-nightcap-accent font-display text-3xl">
                  {(profile?.display_name || "?")[0].toUpperCase()}
                </div>
              )}
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                <span className="text-white text-xs font-medium">Edit</span>
              </div>
            </Link>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="font-display text-3xl text-white">
                  {profile?.display_name || "You"}
                </h1>
                <Link
                  href="/profile/edit"
                  className="rounded-full bg-nightcap-accent/20 border border-nightcap-accent/50 px-4 py-2 text-sm font-medium text-nightcap-accent hover:bg-nightcap-accent/30 transition"
                >
                  Edit profile
                </Link>
              </div>
              {user.phone && (
                <p className="text-nightcap-muted text-sm mt-1">{formatPhoneForDisplay(user.phone)}</p>
              )}
              {profile?.bio && (
                <p className="text-nightcap-muted mt-4">{profile.bio}</p>
              )}
              <p className="text-nightcap-accent font-medium mt-4">
                {count ?? 0} {count === 1 ? "entry" : "entries"}
              </p>
            </div>
          </div>
        </div>

        {s.total_entries > 0 && (
          <div className="mt-6 glass rounded-2xl p-6">
            <h2 className="font-display text-xl text-nightcap-accent mb-4">Your stats</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {s.avg_rating != null && (
                <div>
                  <p className="text-nightcap-muted text-sm">Avg rating</p>
                  <p className="text-white text-2xl font-display">{Number(s.avg_rating).toFixed(1)} / 5</p>
                </div>
              )}
              <div>
                <p className="text-nightcap-muted text-sm">Romance logged</p>
                <p className="text-white text-2xl font-display">{s.kiss_count} {s.kiss_count === 1 ? "entry" : "entries"}</p>
              </div>
              {(s.missions_completed ?? 0) > 0 && (
                <div>
                  <p className="text-nightcap-muted text-sm">Missions completed</p>
                  <p className="text-white text-2xl font-display">{s.missions_completed}</p>
                </div>
              )}
              {s.top_club_name && (
                <div className="sm:col-span-2">
                  <p className="text-nightcap-muted text-sm">Most visited club</p>
                  <p className="text-white text-xl font-display">{s.top_club_name}</p>
                  <p className="text-nightcap-muted text-sm">{s.top_club_visits} {s.top_club_visits === 1 ? "visit" : "visits"}</p>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="mt-8 space-y-4">
          <Link
            href="/profile/edit"
            className="block glass rounded-2xl p-6 transition hover:border-nightcap-accent/30"
          >
            <h2 className="font-display text-xl text-white">Edit profile</h2>
            <p className="text-nightcap-muted text-sm mt-1">
              Update your photo, name, and bio
            </p>
          </Link>
          <Link
            href="/leaderboard"
            className="block glass rounded-2xl p-6 transition hover:border-nightcap-accent/30"
          >
            <h2 className="font-display text-xl text-white">Leaderboard</h2>
            <p className="text-nightcap-muted text-sm mt-1">
              See how you rank vs friends
            </p>
          </Link>
          <Link
            href="/notifications"
            className="block glass rounded-2xl p-6 transition hover:border-nightcap-accent/30"
          >
            <h2 className="font-display text-xl text-white">Notifications</h2>
            <p className="text-nightcap-muted text-sm mt-1">
              Reactions, comments, and friend requests
            </p>
          </Link>
          <Link
            href="/friends"
            className="block glass rounded-2xl p-6 transition hover:border-nightcap-accent/30"
          >
            <h2 className="font-display text-xl text-white">Friends</h2>
            <p className="text-nightcap-muted text-sm mt-1">
              Find and follow friends
            </p>
          </Link>
          <Link
            href="/entries"
            className="block glass rounded-2xl p-6 transition hover:border-nightcap-accent/30"
          >
            <h2 className="font-display text-xl text-white">View all entries</h2>
            <p className="text-nightcap-muted text-sm mt-1">
              See your journal and timeline
            </p>
          </Link>
          <Link
            href="/entries/new"
            className="block glass rounded-2xl p-6 transition hover:border-nightcap-accent/30"
          >
            <h2 className="font-display text-xl text-white">New entry</h2>
            <p className="text-nightcap-muted text-sm mt-1">
              Log another night out
            </p>
          </Link>

          <div className="mt-8 pt-6 border-t border-white/10">
            <h2 className="font-display text-lg text-nightcap-muted mb-4">Account</h2>
            <form action="/auth/signout" method="post" className="mb-4">
              <button
                type="submit"
                className="w-full rounded-xl glass px-6 py-3 font-medium text-white transition hover:border-nightcap-accent/30 text-left"
              >
                Log out
              </button>
            </form>
            <DeleteAccountButton />
          </div>
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
