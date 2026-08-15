"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { fetchOk } from "@/lib/fetch-client";

interface ReportBlockMenuProps {
  reportedUserId: string;
  reportedUserName?: string | null;
  entryId?: string;
  commentId?: string;
  variant?: "entry" | "comment" | "profile";
}

export function ReportBlockMenu({
  reportedUserId,
  reportedUserName,
  entryId,
  commentId,
}: ReportBlockMenuProps) {
  const [open, setOpen] = useState(false);
  const [reporting, setReporting] = useState(false);
  const [blocking, setBlocking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleReport = async () => {
    setReporting(true);
    setError(null);
    try {
      const result = await fetchOk("/api/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reported_user_id: reportedUserId,
          entry_id: entryId || undefined,
          comment_id: commentId || undefined,
          reason: "Inappropriate content",
        }),
      });
      if (!result.ok) {
        setError(result.message);
        return;
      }
      setOpen(false);
      alert("Thank you. We'll review this within 24 hours.");
    } finally {
      setReporting(false);
    }
  };

  const handleBlock = async () => {
    if (!confirm(`Block ${reportedUserName || "this user"}? Their content will be removed from your feed.`)) return;
    setBlocking(true);
    setError(null);
    try {
      const result = await fetchOk("/api/block", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ blocked_id: reportedUserId }),
      });
      if (!result.ok) {
        setError(result.message);
        return;
      }
      setOpen(false);
      router.refresh();
      router.push("/feed");
    } finally {
      setBlocking(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="p-2 rounded-lg text-nightcap-muted hover:text-white hover:bg-white/5 transition"
        aria-label="More options"
      >
        ⋮
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 z-50 glass rounded-xl py-2 min-w-[180px] shadow-lg">
            {error && (
              <p className="px-4 py-2 text-xs text-red-400 border-b border-white/10">{error}</p>
            )}
            <button
              onClick={handleReport}
              disabled={reporting}
              className="w-full px-4 py-2 text-left text-sm text-white hover:bg-white/5 disabled:opacity-50"
            >
              {reporting ? "Reporting..." : entryId ? "Report post" : commentId ? "Report comment" : "Report user"}
            </button>
            <button
              onClick={handleBlock}
              disabled={blocking}
              className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-white/5 disabled:opacity-50"
            >
              {blocking ? "Blocking..." : "Block user"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
