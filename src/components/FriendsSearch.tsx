"use client";

import { useState } from "react";
import { fetchJson, fetchOk } from "@/lib/fetch-client";
import type { FollowStatus } from "@/lib/friends";
import { SafeImage } from "@/components/SafeImage";

interface SearchUser {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  followStatus?: FollowStatus;
  isFollowing?: boolean;
}

function buttonLabel(status: FollowStatus): string {
  switch (status) {
    case "accepted":
      return "Friends";
    case "pending_out":
      return "Request sent";
    case "pending_in":
      return "Respond on Friends";
    case "rejected":
      return "Denied";
    default:
      return "Add friend";
  }
}

export function FriendsSearch() {
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState<SearchUser[]>([]);
  const [statusMap, setStatusMap] = useState<Map<string, FollowStatus>>(new Map());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const result = await fetchJson<{ users?: SearchUser[] }>(
        `/api/friends/search?q=${encodeURIComponent(query.trim())}`
      );
      if (!result.ok) {
        setError(result.message);
        setUsers([]);
        return;
      }
      const list = result.data.users || [];
      setUsers(list);
      setStatusMap(
        new Map(list.map((u) => [u.id, u.followStatus || (u.isFollowing ? "accepted" : "none")]))
      );
    } finally {
      setLoading(false);
    }
  };

  const toggleFollow = async (userId: string) => {
    const status = statusMap.get(userId) || "none";
    setError(null);

    if (status === "pending_in") {
      setError("Open the Friends page to accept or deny this request.");
      return;
    }

    try {
      if (status === "accepted" || status === "pending_out") {
        const result = await fetchOk(`/api/friends/follow?userId=${userId}`, { method: "DELETE" });
        if (!result.ok) {
          setError(result.message);
          return;
        }
        setStatusMap((prev) => new Map(prev).set(userId, "none"));
      } else {
        const result = await fetchOk("/api/friends/follow", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId }),
        });
        if (!result.ok) {
          setError(result.message);
          return;
        }
        setStatusMap((prev) => new Map(prev).set(userId, "pending_out"));
      }
    } catch {
      setError("Could not update friend request. Try again.");
    }
  };

  return (
    <div className="space-y-4">
      {error && (
        <p className="text-red-400 text-sm" role="alert">
          {error}
        </p>
      )}
      <div className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && search()}
          placeholder="Search by name..."
          className="flex-1 rounded-xl bg-nightcap/80 border border-white/10 px-4 py-3 text-white placeholder:text-nightcap-muted focus:border-nightcap-accent focus:outline-none"
        />
        <button
          type="button"
          onClick={search}
          disabled={loading || !query.trim()}
          className="rounded-xl bg-nightcap-accent px-5 py-3 font-medium text-white transition hover:opacity-90 disabled:opacity-50"
        >
          {loading ? "Searching..." : "Search"}
        </button>
      </div>
      {users.length > 0 && (
        <div className="space-y-2">
          {users.map((u) => {
            const status = statusMap.get(u.id) || "none";
            const disabled = status === "pending_in" || status === "rejected";
            return (
              <div
                key={u.id}
                className="glass rounded-xl p-4 flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-4">
                  <div className="relative w-10 h-10 rounded-full overflow-hidden bg-nightcap-muted flex-shrink-0">
                    {u.avatar_url ? (
                      <SafeImage
                        src={u.avatar_url}
                        alt=""
                        fill
                        className="object-cover"
                        fallbackLetter={(u.display_name || "?")[0]}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-nightcap-accent font-display">
                        {(u.display_name || "?")[0].toUpperCase()}
                      </div>
                    )}
                  </div>
                  <span className="text-white">{u.display_name || "Unknown"}</span>
                </div>
                <button
                  type="button"
                  onClick={() => toggleFollow(u.id)}
                  disabled={disabled}
                  className={`rounded-lg px-4 py-2 text-sm font-medium transition disabled:opacity-50 ${
                    status === "accepted" || status === "pending_out"
                      ? "bg-nightcap-muted text-nightcap-muted"
                      : "bg-nightcap-accent text-white hover:opacity-90"
                  }`}
                >
                  {buttonLabel(status)}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
