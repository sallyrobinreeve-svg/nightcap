import { createClient } from "@/lib/supabase/server";
import type { NotificationItem } from "@/lib/notifications";
import type { ReactionType } from "@/types/database";
import type { SupabaseClient } from "@supabase/supabase-js";

export async function fetchNotificationsForUser(
  supabase: SupabaseClient,
  userId: string
): Promise<NotificationItem[]> {
  const [{ data: blockedByMe }, { data: blockedMe }] = await Promise.all([
    supabase.from("blocks").select("blocked_id").eq("blocker_id", userId),
    supabase.from("blocks").select("blocker_id").eq("blocked_id", userId),
  ]);

  const blockedIds = new Set<string>([
    ...(blockedByMe || []).map((b) => b.blocked_id),
    ...(blockedMe || []).map((b) => b.blocker_id),
  ]);

  const { data: myEntries } = await supabase
    .from("entries")
    .select("id, date_of_night")
    .eq("user_id", userId);

  const entryIds = (myEntries || []).map((e) => e.id);
  const entryDateMap = new Map(
    (myEntries || []).map((e) => [e.id, e.date_of_night])
  );

  const [{ data: reactions }, { data: comments }, { data: pendingFollows }] =
    await Promise.all([
      entryIds.length > 0
        ? supabase
            .from("reactions")
            .select("id, entry_id, user_id, type, created_at")
            .in("entry_id", entryIds)
            .neq("user_id", userId)
            .order("created_at", { ascending: false })
            .limit(50)
        : Promise.resolve({ data: [] }),
      entryIds.length > 0
        ? supabase
            .from("comments")
            .select("id, entry_id, user_id, content, created_at")
            .in("entry_id", entryIds)
            .neq("user_id", userId)
            .order("created_at", { ascending: false })
            .limit(50)
        : Promise.resolve({ data: [] }),
      supabase
        .from("follows")
        .select("follower_id, created_at")
        .eq("following_id", userId)
        .eq("status", "pending")
        .order("created_at", { ascending: false }),
    ]);

  const actorIds = new Set<string>();
  (reactions || []).forEach((r) => {
    if (!blockedIds.has(r.user_id)) actorIds.add(r.user_id);
  });
  (comments || []).forEach((c) => {
    if (!blockedIds.has(c.user_id)) actorIds.add(c.user_id);
  });
  (pendingFollows || []).forEach((f) => {
    if (!blockedIds.has(f.follower_id)) actorIds.add(f.follower_id);
  });

  const { data: profiles } =
    actorIds.size > 0
      ? await supabase
          .from("profiles")
          .select("id, display_name, avatar_url")
          .in("id", Array.from(actorIds))
      : { data: [] };

  const profileMap = new Map((profiles || []).map((p) => [p.id, p]));
  const notifications: NotificationItem[] = [];

  for (const r of reactions || []) {
    if (blockedIds.has(r.user_id)) continue;
    const actor = profileMap.get(r.user_id);
    if (!actor) continue;
    notifications.push({
      id: `reaction:${r.id}`,
      type: "reaction",
      actor,
      createdAt: r.created_at,
      entryId: r.entry_id,
      entryDate: entryDateMap.get(r.entry_id),
      reactionType: r.type as ReactionType,
    });
  }

  for (const c of comments || []) {
    if (blockedIds.has(c.user_id)) continue;
    const actor = profileMap.get(c.user_id);
    if (!actor) continue;
    notifications.push({
      id: `comment:${c.id}`,
      type: "comment",
      actor,
      createdAt: c.created_at,
      entryId: c.entry_id,
      entryDate: entryDateMap.get(c.entry_id),
      commentPreview: c.content.slice(0, 120),
    });
  }

  for (const f of pendingFollows || []) {
    if (blockedIds.has(f.follower_id)) continue;
    const actor = profileMap.get(f.follower_id);
    if (!actor) continue;
    notifications.push({
      id: `follow:${f.follower_id}`,
      type: "follow_request",
      actor,
      createdAt: f.created_at,
    });
  }

  notifications.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return notifications;
}

export async function getNotificationState(userId: string) {
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("last_notifications_seen_at")
    .eq("id", userId)
    .maybeSingle();

  const notifications = await fetchNotificationsForUser(supabase, userId);
  const lastSeen = profile?.last_notifications_seen_at ?? null;

  return { notifications, lastSeen };
}
