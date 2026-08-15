import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { acceptedFriendIdsFromRows } from "@/lib/friends";
import { BottomNav } from "@/components/BottomNav";
import { Trophy } from "lucide-react";

export default async function LeaderboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/signin");
  }

  const { data: friendRows } = await supabase
    .from("follows")
    .select("follower_id, following_id, status")
    .eq("status", "accepted")
    .or(`follower_id.eq.${user.id},following_id.eq.${user.id}`);

  const friendIds = Array.from(acceptedFriendIdsFromRows(friendRows || [], user.id));
  const allIds = [user.id, ...friendIds];

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, display_name, avatar_url")
    .in("id", allIds);

  const { data: stats } = await supabase
    .from("user_stats")
    .select("user_id, total_entries, avg_rating, kiss_count, missions_completed, top_club_visits")
    .in("user_id", allIds);

  const profileMap = new Map((profiles || []).map((p) => [p.id, p]));
  const statsMap = new Map((stats || []).map((s) => [s.user_id, s]));

  const entries = allIds.map((id) => {
    const profile = profileMap.get(id);
    const s = statsMap.get(id);
    return {
      id,
      display_name: profile?.display_name ?? "Unknown",
      avatar_url: profile?.avatar_url ?? null,
      isMe: id === user.id,
      total_entries: s?.total_entries ?? 0,
      avg_rating: s?.avg_rating ?? null,
      kiss_count: s?.kiss_count ?? 0,
      missions_completed: s?.missions_completed ?? 0,
      top_club_visits: s?.top_club_visits ?? 0,
    };
  });

  const byEntries = [...entries].sort((a, b) => b.total_entries - a.total_entries);
  const byRating = [...entries].filter((e) => e.avg_rating != null).sort((a, b) => (b.avg_rating ?? 0) - (a.avg_rating ?? 0));
  const byMissions = [...entries].sort((a, b) => b.missions_completed - a.missions_completed);
  const byRomance = [...entries].sort((a, b) => b.kiss_count - a.kiss_count);
  const byClubVisits = [...entries].sort((a, b) => b.top_club_visits - a.top_club_visits);

  return (
    <div className="min-h-screen bg-nightcap pb-24">
      <nav className="glass sticky top-0 z-10 border-b border-white/5">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Link href="/" className="font-display text-2xl text-nightcap-accent">
            NightCapt
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/profile" className="text-nightcap-muted hover:text-white transition">
              Profile
            </Link>
            <Link href="/friends" className="text-nightcap-muted hover:text-white transition">
              Friends
            </Link>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-2xl px-4 py-12">
        <h1 className="font-display text-4xl text-white mb-2 flex items-center gap-2">
          <Trophy className="text-nightcap-accent" size={36} />
          Leaderboard
        </h1>
        <p className="text-nightcap-muted mb-8">
          You and your friends – ranked by stats
        </p>

        {entries.length === 1 ? (
          <div className="glass rounded-2xl p-8 text-center">
            <p className="text-nightcap-muted">
              Follow friends to see them on the leaderboard!
            </p>
            <Link
              href="/friends"
              className="inline-block mt-4 text-nightcap-accent hover:underline"
            >
              Find friends
            </Link>
          </div>
        ) : (
          <div className="space-y-8">
            <LeaderboardSection
              title="Most entries"
              items={byEntries}
              valueKey="total_entries"
              formatValue={(v) => `${v} ${v === 1 ? "entry" : "entries"}`}
            />
            <LeaderboardSection
              title="Highest avg rating"
              items={byRating}
              valueKey="avg_rating"
              formatValue={(v) => `${Number(v).toFixed(1)} / 5`}
            />
            <LeaderboardSection
              title="Missions completed"
              items={byMissions}
              valueKey="missions_completed"
              formatValue={(v) => `${v} ${v === 1 ? "mission" : "missions"}`}
            />
            <LeaderboardSection
              title="Romance logged"
              items={byRomance}
              valueKey="kiss_count"
              formatValue={(v) => `${v} ${v === 1 ? "entry" : "entries"}`}
            />
            <LeaderboardSection
              title="Club visits (top spot)"
              items={byClubVisits}
              valueKey="top_club_visits"
              formatValue={(v) => `${v} ${v === 1 ? "visit" : "visits"}`}
            />
          </div>
        )}
      </main>
      <BottomNav />
    </div>
  );
}

function LeaderboardSection({
  title,
  items,
  valueKey,
  formatValue,
}: {
  title: string;
  items: { id: string; display_name: string; avatar_url: string | null; isMe: boolean }[];
  valueKey: string;
  formatValue: (v: number) => string;
}) {
  const getValue = (item: Record<string, unknown>) => {
    const v = item[valueKey];
    if (v === null || v === undefined) return -1;
    return Number(v);
  };

  return (
    <div className="glass rounded-2xl p-6">
      <h2 className="font-display text-xl text-nightcap-accent mb-4">{title}</h2>
      <div className="space-y-3">
        {items.map((item, i) => {
          const val = getValue(item as Record<string, unknown>);
          if (valueKey === "avg_rating" && val < 0) return null;
          const rank = i + 1;
          const medal = rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : null;
          return (
            <Link
              key={item.id}
              href={item.isMe ? "/profile" : `/profile/${item.id}`}
              className={`flex items-center gap-4 p-3 rounded-xl transition hover:bg-nightcap-card/50 ${
                item.isMe ? "border border-nightcap-accent/50" : ""
              }`}
            >
              <span className="w-8 text-center font-display text-lg text-nightcap-muted">
                {medal ?? rank}
              </span>
              <div className="relative w-10 h-10 rounded-full overflow-hidden bg-nightcap-muted flex-shrink-0">
                {item.avatar_url ? (
                  <Image src={item.avatar_url} alt="" fill className="object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-nightcap-accent text-sm font-display">
                    {(item.display_name || "?")[0].toUpperCase()}
                  </div>
                )}
              </div>
              <span className="flex-1 text-white font-medium truncate">
                {item.display_name}
                {item.isMe && " (you)"}
              </span>
              <span className="text-nightcap-muted text-sm">
                {val >= 0 ? formatValue(val) : "–"}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
