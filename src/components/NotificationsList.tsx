"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { Flame, Heart, Laugh, Zap, MessageCircle, UserPlus } from "lucide-react";
import { SafeImage } from "@/components/SafeImage";
import { fetchOk } from "@/lib/fetch-client";
import {
  notificationMessage,
  type NotificationItem,
} from "@/lib/notifications";
import type { ReactionType } from "@/types/database";

const REACTION_ICONS: Record<ReactionType, React.ElementType> = {
  fire: Flame,
  heart: Heart,
  laugh: Laugh,
  wild: Zap,
};

interface NotificationsListProps {
  initialNotifications: NotificationItem[];
}

export function NotificationsList({ initialNotifications }: NotificationsListProps) {
  const router = useRouter();
  const [items, setItems] = useState(initialNotifications);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  useEffect(() => {
    void fetchOk("/api/notifications/read", { method: "POST" });
  }, []);

  const respondToRequest = async (userId: string, action: "accept" | "reject") => {
    setLoadingId(userId);
    try {
      const result = await fetchOk("/api/friends/follow/respond", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, action }),
      });
      if (result.ok) {
        setItems((prev) => prev.filter((n) => n.id !== `follow:${userId}`));
        router.refresh();
      }
    } finally {
      setLoadingId(null);
    }
  };

  if (items.length === 0) {
    return (
      <div className="glass rounded-2xl p-12 text-center">
        <p className="text-nightcap-muted">No notifications yet.</p>
        <p className="text-nightcap-muted text-sm mt-2">
          When friends react, comment, or send requests, they&apos;ll show up here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((item) => {
        const Icon =
          item.type === "reaction" && item.reactionType
            ? REACTION_ICONS[item.reactionType]
            : item.type === "comment"
              ? MessageCircle
              : UserPlus;

        const content = (
          <div className="flex items-start gap-4 min-w-0">
            <div className="relative w-12 h-12 rounded-full overflow-hidden bg-nightcap-muted flex-shrink-0">
              {item.actor.avatar_url ? (
                <SafeImage
                  src={item.actor.avatar_url}
                  alt=""
                  fill
                  className="object-cover"
                  fallbackLetter={(item.actor.display_name || "?")[0]}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-nightcap-accent font-display text-lg">
                  {(item.actor.display_name || "?")[0].toUpperCase()}
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start gap-2">
                <Icon size={18} className="text-nightcap-accent flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-white">{notificationMessage(item)}</p>
                  {item.commentPreview && (
                    <p className="text-nightcap-muted text-sm mt-1 line-clamp-2">
                      &ldquo;{item.commentPreview}&rdquo;
                    </p>
                  )}
                  {item.entryDate && (
                    <p className="text-nightcap-muted text-xs mt-1">
                      Entry: {new Date(item.entryDate).toLocaleDateString(undefined, {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                  )}
                  <p className="text-nightcap-muted text-xs mt-1">
                    {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                  </p>
                </div>
              </div>
              {item.type === "follow_request" && (
                <div className="flex gap-2 mt-3">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      void respondToRequest(item.actor.id, "accept");
                    }}
                    disabled={loadingId === item.actor.id}
                    className="rounded-lg bg-nightcap-accent px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
                  >
                    Accept
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      void respondToRequest(item.actor.id, "reject");
                    }}
                    disabled={loadingId === item.actor.id}
                    className="rounded-lg glass px-4 py-2 text-sm font-medium text-white hover:border-red-500/50 disabled:opacity-50"
                  >
                    Deny
                  </button>
                </div>
              )}
            </div>
          </div>
        );

        if (item.type === "follow_request") {
          return (
            <div key={item.id} className="glass rounded-2xl p-4 transition hover:border-nightcap-accent/30">
              {content}
            </div>
          );
        }

        return (
          <Link
            key={item.id}
            href={item.entryId ? `/entries/${item.entryId}` : `/profile/${item.actor.id}`}
            className="block glass rounded-2xl p-4 transition hover:border-nightcap-accent/30"
          >
            {content}
          </Link>
        );
      })}
    </div>
  );
}
