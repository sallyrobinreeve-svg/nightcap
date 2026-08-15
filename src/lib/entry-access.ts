import type { SupabaseClient } from "@supabase/supabase-js";
import { acceptedFriendIdsFromRows } from "@/lib/friends";

export async function canViewEntry(
  supabase: SupabaseClient,
  viewerId: string,
  entry: { user_id: string; visibility: string }
): Promise<boolean> {
  if (entry.user_id === viewerId) return true;
  if (entry.visibility === "public") return true;
  if (entry.visibility !== "friends") return false;

  const { data: rows } = await supabase
    .from("follows")
    .select("follower_id, following_id, status")
    .eq("status", "accepted")
    .or(`follower_id.eq.${viewerId},following_id.eq.${viewerId}`);

  const friendIds = acceptedFriendIdsFromRows(rows || [], viewerId);
  return friendIds.has(entry.user_id);
}
