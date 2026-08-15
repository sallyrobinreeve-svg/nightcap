import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { acceptedFriendIdsFromRows } from "@/lib/friends";
import { EntryCard } from "@/components/EntryCard";
import { MissionsHighlight } from "@/components/MissionsHighlight";
import { BottomNav } from "@/components/BottomNav";
import { NotificationBell } from "@/components/NotificationBell";

export default async function FeedPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/signin");
  }

  const { data: blocked, error: blockError } = await supabase
    .from("blocks")
    .select("blocked_id")
    .eq("blocker_id", user.id);
  const blockedIds = blockError
    ? new Set<string>()
    : new Set((blocked || []).map((b) => b.blocked_id));

  const { data: friendRows } = await supabase
    .from("follows")
    .select("follower_id, following_id, status")
    .eq("status", "accepted")
    .or(`follower_id.eq.${user.id},following_id.eq.${user.id}`);

  const friendIds = acceptedFriendIdsFromRows(friendRows || [], user.id);

  const { data: entries, error } = await supabase
    .from("entries")
    .select("id, user_id, date_of_night, rating, prompts, created_at")
    .order("date_of_night", { ascending: false })
    .limit(50);

  if (error) {
    return (
      <div className="min-h-screen bg-nightcap flex items-center justify-center">
        <p className="text-red-400">Failed to load feed</p>
      </div>
    );
  }

  const entryIds = (entries || []).map((e) => e.id);
  const userIds = Array.from(new Set((entries || []).map((e) => e.user_id)));

  const [{ data: profiles }, { data: photos }, { data: reactions }, { data: commentCounts }] =
    await Promise.all([
      userIds.length > 0
        ? supabase.from("profiles").select("id, display_name, avatar_url").in("id", userIds)
        : Promise.resolve({ data: [] as { id: string; display_name: string | null; avatar_url: string | null }[] }),
      entryIds.length > 0
        ? supabase.from("photos").select("entry_id, type, url").in("entry_id", entryIds)
        : Promise.resolve({ data: [] as { entry_id: string; type: string; url: string }[] }),
      entryIds.length > 0
        ? supabase.from("reactions").select("entry_id, type").in("entry_id", entryIds)
        : Promise.resolve({ data: [] as { entry_id: string; type: string }[] }),
      entryIds.length > 0
        ? supabase.from("comments").select("entry_id").in("entry_id", entryIds)
        : Promise.resolve({ data: [] as { entry_id: string }[] }),
    ]);

  const profileMap = new Map((profiles || []).map((p) => [p.id, p]));

  const photoMap = new Map<string, string>();
  (photos || []).forEach((p) => {
    if ((p.type === "favourite" || p.type === "outfit") && !photoMap.has(p.entry_id)) {
      photoMap.set(p.entry_id, p.url);
    }
  });

  const reactionCountMap = new Map<string, number>();
  (reactions || []).forEach((r) => {
    reactionCountMap.set(r.entry_id, (reactionCountMap.get(r.entry_id) || 0) + 1);
  });

  const commentCountMap = new Map<string, number>();
  (commentCounts || []).forEach((c) => {
    commentCountMap.set(c.entry_id, (commentCountMap.get(c.entry_id) || 0) + 1);
  });

  const filteredEntries = (entries || []).filter(
    (e) =>
      !blockedIds.has(e.user_id) &&
      (e.user_id === user.id || friendIds.has(e.user_id))
  );
  const feedEntries = filteredEntries.map((e) => ({
    ...e,
    profile: profileMap.get(e.user_id),
    thumbnailUrl: photoMap.get(e.id) || null,
    reactionCount: reactionCountMap.get(e.id) || 0,
    commentCount: commentCountMap.get(e.id) || 0,
  }));

  return (
    <div className="min-h-screen bg-nightcap page-with-nav">
      <nav className="glass sticky top-0 z-10 border-b border-white/5 safe-area-pt">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <Link href="/" className="font-display text-xl text-nightcap-accent">
            NightCapt
          </Link>
          <div className="flex items-center gap-2">
            <NotificationBell />
            <div className="hidden md:flex items-center gap-4">
            <Link
              href="/entries/new"
              className="rounded-full bg-nightcap-accent px-5 py-2.5 font-medium text-white transition hover:opacity-90"
            >
              New Entry
            </Link>
            <Link href="/friends" className="text-nightcap-muted hover:text-white transition">
              Friends
            </Link>
            <Link href="/entries" className="text-nightcap-muted hover:text-white transition">
              Entries
            </Link>
            <Link href="/profile" className="text-nightcap-muted hover:text-white transition">
              Profile
            </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="font-display text-4xl text-white mb-8">Feed</h1>
        <MissionsHighlight />

        {feedEntries.length === 0 ? (
          <div className="glass rounded-2xl p-12 text-center">
            <p className="text-nightcap-muted mb-6">No entries in your feed yet.</p>
            <p className="text-nightcap-muted text-sm mb-6">
              Accept friend requests or add friends — their entries will appear here.
            </p>
            <Link
              href="/friends"
              className="inline-flex rounded-full glass px-6 py-3 font-medium text-white transition hover:border-nightcap-accent/50 mr-3"
            >
              Find friends
            </Link>
            <Link
              href="/entries/new"
              className="inline-flex rounded-full bg-nightcap-accent px-6 py-3 font-medium text-white transition hover:opacity-90"
            >
              Create first entry
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {feedEntries.map((entry) => (
              <EntryCard key={entry.id} entry={entry} currentUserId={user.id} />
            ))}
          </div>
        )}
      </main>
      <BottomNav />
    </div>
  );
}
