import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { acceptedFriendIdsFromRows } from "@/lib/friends";
import { FriendsSearch } from "@/components/FriendsSearch";
import { FollowRequests } from "@/components/FollowButton";
import { SafeImage } from "@/components/SafeImage";
import { BottomNav } from "@/components/BottomNav";

export default async function FriendsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/signin");
  }

  const { data: pending } = await supabase
    .from("follows")
    .select("follower_id, created_at")
    .eq("following_id", user.id)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  const pendingIds = (pending || []).map((p) => p.follower_id);
  let pendingProfiles: { id: string; display_name: string | null; avatar_url: string | null }[] = [];
  if (pendingIds.length > 0) {
    const { data } = await supabase
      .from("profiles")
      .select("id, display_name, avatar_url")
      .in("id", pendingIds);
    pendingProfiles = data || [];
  }
  const pendingProfileMap = new Map(pendingProfiles.map((p) => [p.id, p]));
  const followRequests = (pending || []).map((p) => ({
    userId: p.follower_id,
    profile: pendingProfileMap.get(p.follower_id) || null,
  }));

  const { data: friendRows } = await supabase
    .from("follows")
    .select("follower_id, following_id, status")
    .eq("status", "accepted")
    .or(`follower_id.eq.${user.id},following_id.eq.${user.id}`);

  const friendIds = Array.from(acceptedFriendIdsFromRows(friendRows || [], user.id));
  let friends: { id: string; display_name: string | null; avatar_url: string | null }[] = [];

  if (friendIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, display_name, avatar_url")
      .in("id", friendIds);
    friends = profiles || [];
  }

  return (
    <div className="min-h-screen bg-nightcap page-with-nav">
      <nav className="glass sticky top-0 z-10 border-b border-white/5 safe-area-pt">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <Link href="/feed" className="text-nightcap-muted hover:text-white text-sm transition">
            ← Back
          </Link>
          <Link href="/" className="font-display text-xl text-nightcap-accent">
            NightCapt
          </Link>
          <span className="w-12" />
        </div>
      </nav>

      <main className="mx-auto max-w-2xl px-4 py-12">
        <h1 className="font-display text-4xl text-white mb-8">Friends</h1>

        <FollowRequests initialRequests={followRequests} />

        <section className="mb-10">
          <h2 className="font-display text-xl text-nightcap-accent mb-4">Find friends</h2>
          <p className="text-nightcap-muted text-sm mb-4">
            Search by display name to send a friend request. When they accept, you&apos;ll see each
            other&apos;s entries in your feed.
          </p>
          <FriendsSearch />
        </section>

        <section>
          <h2 className="font-display text-xl text-nightcap-accent mb-4">
            Friends ({friends.length})
          </h2>
          {friends.length === 0 ? (
            <p className="text-nightcap-muted">
              No friends yet. Send a request above or accept incoming requests.
            </p>
          ) : (
            <div className="space-y-4">
              {friends.map((f) => (
                <Link
                  key={f.id}
                  href={`/profile/${f.id}`}
                  className="block glass rounded-2xl p-4 flex items-center gap-4 transition hover:border-nightcap-accent/30"
                >
                  <div className="relative w-12 h-12 rounded-full overflow-hidden bg-nightcap-muted flex-shrink-0">
                    {f.avatar_url ? (
                      <SafeImage
                        src={f.avatar_url}
                        alt=""
                        fill
                        className="object-cover"
                        fallbackLetter={(f.display_name || "?")[0]}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-nightcap-accent font-display text-lg">
                        {(f.display_name || "?")[0].toUpperCase()}
                      </div>
                    )}
                  </div>
                  <span className="text-white font-medium">{f.display_name || "Unknown"}</span>
                </Link>
              ))}
            </div>
          )}
        </section>
      </main>
      <BottomNav />
    </div>
  );
}
