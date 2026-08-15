export type FollowStatus = "none" | "pending_out" | "pending_in" | "accepted" | "rejected";

export function deriveFollowStatus(
  outgoing: { status: string } | null,
  incoming: { status: string } | null
): FollowStatus {
  if (outgoing?.status === "accepted" || incoming?.status === "accepted") {
    return "accepted";
  }
  if (outgoing?.status === "pending") return "pending_out";
  if (incoming?.status === "pending") return "pending_in";
  if (outgoing?.status === "rejected" || incoming?.status === "rejected") {
    return "rejected";
  }
  return "none";
}

/** User IDs with an accepted friendship (either direction). */
export function acceptedFriendIdsFromRows(
  rows: { follower_id: string; following_id: string; status: string }[],
  userId: string
): Set<string> {
  const ids = new Set<string>();
  for (const row of rows) {
    if (row.status !== "accepted") continue;
    if (row.follower_id === userId) ids.add(row.following_id);
    if (row.following_id === userId) ids.add(row.follower_id);
  }
  return ids;
}
