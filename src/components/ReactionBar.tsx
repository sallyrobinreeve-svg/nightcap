"use client";

import { useState } from "react";
import { Flame, Heart, Laugh, Zap } from "lucide-react";
import { useRouter } from "next/navigation";
import type { ReactionType } from "@/types/database";
import { fetchOk } from "@/lib/fetch-client";

const REACTIONS: { type: ReactionType; icon: React.ElementType; label: string }[] = [
  { type: "fire", icon: Flame, label: "Fire" },
  { type: "heart", icon: Heart, label: "Heart" },
  { type: "laugh", icon: Laugh, label: "Laugh" },
  { type: "wild", icon: Zap, label: "Wild" },
];

interface ReactionBarProps {
  entryId: string;
  initialReactions: { type: string; count: number }[];
  userReaction: ReactionType | null;
}

export function ReactionBar({
  entryId,
  initialReactions,
  userReaction: initialUserReaction,
}: ReactionBarProps) {
  const router = useRouter();
  const [userReaction, setUserReaction] = useState<ReactionType | null>(initialUserReaction);
  const [counts, setCounts] = useState(
    REACTIONS.map((r) => ({
      type: r.type,
      count: initialReactions.find((x) => x.type === r.type)?.count || 0,
    }))
  );
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const toggle = async (type: ReactionType) => {
    const isActive = userReaction === type;
    setLoading(type);
    setError(null);
    try {
      if (isActive) {
        const result = await fetchOk(`/api/entries/${entryId}/reactions`, { method: "DELETE" });
        if (!result.ok) {
          setError(result.message);
          return;
        }
        setUserReaction(null);
        setCounts((prev) =>
          prev.map((c) =>
            c.type === type ? { ...c, count: Math.max(0, c.count - 1) } : c
          )
        );
      } else {
        const result = await fetchOk(`/api/entries/${entryId}/reactions`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type }),
        });
        if (!result.ok) {
          setError(result.message);
          return;
        }
        const prevType = userReaction;
        setUserReaction(type);
        setCounts((prev) =>
          prev.map((c) => {
            if (c.type === type) return { ...c, count: c.count + 1 };
            if (prevType && c.type === prevType) return { ...c, count: Math.max(0, c.count - 1) };
            return c;
          })
        );
      }
      router.refresh();
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="space-y-2">
      {error && (
        <p className="text-red-400 text-sm" role="alert">
          {error}
        </p>
      )}
      <div className="flex gap-4 flex-wrap">
        {REACTIONS.map(({ type, icon: Icon }) => {
          const count = counts.find((c) => c.type === type)?.count || 0;
          const isActive = userReaction === type;
          return (
            <button
              key={type}
              type="button"
              onClick={() => toggle(type)}
              disabled={!!loading}
              className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm transition ${
                isActive
                  ? "bg-nightcap-accent text-white"
                  : "bg-nightcap-card/60 text-nightcap-muted hover:text-white"
              }`}
            >
              <Icon size={18} />
              {count > 0 && <span>{count}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
