import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatDateSafe } from "@/lib/format-date";

export async function MissionsHighlight() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const weekAgoStr = weekAgo.toISOString().slice(0, 10);

  const { data: entries } = await supabase
    .from("entries")
    .select("id, user_id, date_of_night, prompts, created_at")
    .gte("date_of_night", weekAgoStr)
    .order("date_of_night", { ascending: false })
    .limit(50);

  const missionEntries = (entries || []).filter((e) => {
    const prompts = e.prompts as Record<string, unknown>;
    const mission = prompts?.mission;
    return mission && String(mission).trim().length > 0;
  }).slice(0, 10);

  if (missionEntries.length === 0) return null;

  const userIds = Array.from(new Set(missionEntries.map((e) => e.user_id)));
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, display_name")
    .in("id", userIds);
  const profileMap = new Map((profiles || []).map((p) => [p.id, p]));

  return (
    <section className="mb-10">
      <h2 className="font-display text-2xl text-nightcap-pink mb-4">
        Top missions this week
      </h2>
      <div className="grid gap-4 sm:grid-cols-2">
        {missionEntries.slice(0, 6).map((e) => {
          const prompts = e.prompts as Record<string, unknown>;
          const mission = String(prompts?.mission || "");
          const profile = profileMap.get(e.user_id);
          return (
            <Link
              key={e.id}
              href={`/entries/${e.id}`}
              className="block glass rounded-xl p-4 transition hover:border-nightcap-accent/30"
            >
              <p className="text-white font-medium line-clamp-2">{mission}</p>
              <p className="text-nightcap-muted text-sm mt-1">
                {formatDateSafe(e.date_of_night, "MMM d")}
                {profile && ` · ${profile.display_name || "Anonymous"}`}
              </p>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
