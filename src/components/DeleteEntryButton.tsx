"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { fetchOk } from "@/lib/fetch-client";

interface DeleteEntryButtonProps {
  entryId: string;
  variant?: "icon" | "text";
  className?: string;
}

export function DeleteEntryButton({ entryId, variant = "text", className = "" }: DeleteEntryButtonProps) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    setDeleting(true);
    setError(null);
    try {
      const result = await fetchOk(`/api/entries/${entryId}`, { method: "DELETE" });
      if (!result.ok) {
        setError(result.message);
        return;
      }
      router.push("/entries");
      router.refresh();
    } finally {
      setDeleting(false);
    }
  };

  if (confirming) {
    return (
      <div className={`flex flex-col gap-2 ${className}`}>
        {error && <p className="text-red-400 text-xs">{error}</p>}
        <div className="flex items-center gap-2">
          <span className="text-sm text-nightcap-muted">Delete?</span>
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="text-sm text-red-400 hover:text-red-300 font-medium disabled:opacity-50"
          >
            {deleting ? "Deleting..." : "Yes"}
          </button>
          <button
            type="button"
            onClick={() => {
              setConfirming(false);
              setError(null);
            }}
            disabled={deleting}
            className="text-sm text-nightcap-muted hover:text-white disabled:opacity-50"
          >
            No
          </button>
        </div>
      </div>
    );
  }

  if (variant === "icon") {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className={`text-red-400 hover:text-red-300 p-1 ${className}`}
        title="Delete entry"
      >
        <Trash2 size={18} />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setConfirming(true)}
      className={`text-sm text-red-400 hover:text-red-300 ${className}`}
    >
      Delete
    </button>
  );
}
