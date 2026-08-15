"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { fetchOk } from "@/lib/fetch-client";

interface BlockButtonProps {
  userId: string;
  displayName?: string | null;
}

export function BlockButton({ userId, displayName }: BlockButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleBlock = async () => {
    if (!confirm(`Block ${displayName || "this user"}? Their content will be removed from your feed.`)) return;
    setLoading(true);
    setError(null);
    try {
      const result = await fetchOk("/api/block", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ blocked_id: userId }),
      });
      if (!result.ok) {
        setError(result.message);
        return;
      }
      router.refresh();
      router.push("/feed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button
        onClick={handleBlock}
        disabled={loading}
        className="mt-2 text-sm text-red-400 hover:text-red-300 disabled:opacity-50"
      >
        {loading ? "Blocking..." : "Block user"}
      </button>
      {error && <p className="text-red-400 text-xs mt-1 max-w-xs">{error}</p>}
    </div>
  );
}
