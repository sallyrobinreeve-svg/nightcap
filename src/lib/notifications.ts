import type { ReactionType } from "@/types/database";

export type NotificationType = "reaction" | "comment" | "follow_request";

export interface NotificationActor {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
}

export interface NotificationItem {
  id: string;
  type: NotificationType;
  actor: NotificationActor;
  createdAt: string;
  entryId?: string;
  entryDate?: string;
  reactionType?: ReactionType;
  commentPreview?: string;
}

const REACTION_LABELS: Record<ReactionType, string> = {
  fire: "🔥",
  heart: "❤️",
  laugh: "😂",
  wild: "⚡",
};

export function reactionEmoji(type: ReactionType): string {
  return REACTION_LABELS[type] ?? type;
}

export function notificationMessage(item: NotificationItem): string {
  const name = item.actor.display_name || "Someone";
  switch (item.type) {
    case "reaction":
      return `${name} reacted ${reactionEmoji(item.reactionType!)} to your entry`;
    case "comment":
      return `${name} commented on your entry`;
    case "follow_request":
      return `${name} sent you a friend request`;
    default:
      return `${name} interacted with you`;
  }
}

export function isUnread(createdAt: string, lastSeen: string | null): boolean {
  if (!lastSeen) return true;
  return new Date(createdAt) > new Date(lastSeen);
}

export function countUnread(
  items: NotificationItem[],
  lastSeen: string | null
): number {
  return items.filter((n) => isUnread(n.createdAt, lastSeen)).length;
}
