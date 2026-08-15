"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { fetchOk } from "@/lib/fetch-client";
import type { FollowStatus } from "@/lib/friends";
import { SafeImage } from "@/components/SafeImage";

interface FollowButtonProps {
  userId: string;
  followStatus: FollowStatus;
}

export function FollowButton({ userId, followStatus: initialStatus }: FollowButtonProps) {
  const router = useRouter();
  const [status, setStatus] = useState<FollowStatus>(initialStatus);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendRequest = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchOk("/api/friends/follow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      if (!result.ok) {
        setError(result.message);
        return;
      }
      setStatus("pending_out");
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  const unfriend = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchOk(`/api/friends/follow?userId=${userId}`, { method: "DELETE" });
      if (!result.ok) {
        setError(result.message);
        return;
      }
      setStatus("none");
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  const respond = async (action: "accept" | "reject") => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchOk("/api/friends/follow/respond", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, action }),
      });
      if (!result.ok) {
        setError(result.message);
        return;
      }
      setStatus(action === "accept" ? "accepted" : "none");
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {status === "pending_in" ? (
        <div className="flex flex-wrap gap-2 mt-4">
          <button
            type="button"
            onClick={() => respond("accept")}
            disabled={loading}
            className="rounded-lg bg-nightcap-accent px-5 py-2.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "..." : "Accept"}
          </button>
          <button
            type="button"
            onClick={() => respond("reject")}
            disabled={loading}
            className="rounded-lg glass px-5 py-2.5 text-sm font-medium text-white hover:border-red-500/50 disabled:opacity-50"
          >
            Deny
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => {
            if (status === "accepted" || status === "pending_out") unfriend();
            else sendRequest();
          }}
          disabled={loading || status === "rejected"}
          className={`mt-4 rounded-lg px-5 py-2.5 text-sm font-medium transition disabled:opacity-50 ${
            status === "accepted"
              ? "bg-nightcap-muted text-nightcap-muted"
              : status === "pending_out"
                ? "bg-nightcap-muted/50 text-nightcap-muted"
                : "bg-nightcap-accent text-white hover:opacity-90"
          }`}
        >
          {loading
            ? "..."
            : status === "accepted"
              ? "Friends"
              : status === "pending_out"
                ? "Request sent"
                : status === "rejected"
                  ? "Request denied"
                  : "Add friend"}
        </button>
      )}
      {error && <p className="text-red-400 text-xs mt-2 max-w-xs">{error}</p>}
    </div>
  );
}

interface FollowRequestsProps {
  initialRequests: {
    userId: string;
    profile: { id: string; display_name: string | null; avatar_url: string | null } | null;
  }[];
}

export function FollowRequests({ initialRequests }: FollowRequestsProps) {
  const router = useRouter();
  const [requests, setRequests] = useState(initialRequests);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const respond = async (userId: string, action: "accept" | "reject") => {
    setLoadingId(userId);
    try {
      const result = await fetchOk("/api/friends/follow/respond", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, action }),
      });
      if (result.ok) {
        setRequests((prev) => prev.filter((r) => r.userId !== userId));
        router.refresh();
      }
    } finally {
      setLoadingId(null);
    }
  };

  if (requests.length === 0) return null;

  return (
    <section className="mb-10">
      <h2 className="font-display text-xl text-nightcap-accent mb-4">
        Friend requests ({requests.length})
      </h2>
      <div className="space-y-3">
        {requests.map((req) => (
          <div
            key={req.userId}
            className="glass rounded-xl p-4 flex items-center justify-between gap-4"
          >
            <div className="flex items-center gap-4 min-w-0">
              <div className="relative w-12 h-12 rounded-full overflow-hidden bg-nightcap-muted flex-shrink-0">
                {req.profile?.avatar_url ? (
                  <SafeImage
                    src={req.profile.avatar_url}
                    alt=""
                    fill
                    className="object-cover"
                    fallbackLetter={(req.profile.display_name || "?")[0]}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-nightcap-accent font-display text-lg">
                    {(req.profile?.display_name || "?")[0].toUpperCase()}
                  </div>
                )}
              </div>
              <span className="text-white font-medium truncate">
                {req.profile?.display_name || "Unknown"}
              </span>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <button
                type="button"
                onClick={() => respond(req.userId, "accept")}
                disabled={loadingId === req.userId}
                className="rounded-lg bg-nightcap-accent px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
              >
                Accept
              </button>
              <button
                type="button"
                onClick={() => respond(req.userId, "reject")}
                disabled={loadingId === req.userId}
                className="rounded-lg glass px-4 py-2 text-sm font-medium text-white hover:border-red-500/50 disabled:opacity-50"
              >
                Deny
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
