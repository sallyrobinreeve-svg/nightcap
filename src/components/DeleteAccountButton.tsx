"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { fetchJson } from "@/lib/fetch-client";

export function DeleteAccountButton() {
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    setLoading(true);
    try {
      const result = await fetchJson("/api/account/delete", { method: "POST" });
      if (!result.ok) {
        alert(result.message);
        return;
      }
      router.push("/");
      router.refresh();
    } catch {
      alert("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (confirming) {
    return (
      <div className="glass rounded-2xl p-6 border-red-500/30">
        <p className="text-white font-medium mb-2">Delete your account?</p>
        <p className="text-nightcap-muted text-sm mb-4">
          This will permanently delete your profile, entries, and all data. This cannot be undone.
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => setConfirming(false)}
            disabled={loading}
            className="rounded-xl glass px-4 py-2 text-sm font-medium text-white hover:border-white/20 transition disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={loading}
            className="rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition disabled:opacity-50"
          >
            {loading ? "Deleting..." : "Yes, delete my account"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="block w-full text-left glass rounded-2xl p-6 transition hover:border-red-500/30"
    >
      <h2 className="font-display text-xl text-red-400">Delete account</h2>
      <p className="text-nightcap-muted text-sm mt-1">
        Permanently delete your account and all data
      </p>
    </button>
  );
}
