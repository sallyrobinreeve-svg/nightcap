"use client";

import { useState } from "react";
import { formatDateSafe } from "@/lib/format-date";
import { fetchJson, fetchOk } from "@/lib/fetch-client";
import { SafeImage } from "@/components/SafeImage";
import { Trash2 } from "lucide-react";
import { ReportBlockMenu } from "@/components/ReportBlockMenu";

interface Comment {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  profile?: { id: string; display_name: string | null; avatar_url: string | null };
}

interface CommentSectionProps {
  entryId: string;
  currentUserId: string;
  initialComments: Comment[];
}

export function CommentSection({
  entryId,
  currentUserId,
  initialComments,
}: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!content.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const result = await fetchJson<{ comment?: Comment }>(`/api/entries/${entryId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: content.trim() }),
      });
      if (!result.ok) {
        setError(result.message);
        return;
      }
      if (result.data.comment) {
        setComments((prev) => [...prev, result.data.comment!]);
        setContent("");
      }
    } finally {
      setLoading(false);
    }
  };

  const deleteComment = async (commentId: string) => {
    const result = await fetchOk(`/api/entries/${entryId}/comments/${commentId}`, {
      method: "DELETE",
    });
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setComments((prev) => prev.filter((c) => c.id !== commentId));
  };

  return (
    <section>
      <h2 className="font-display text-xl text-nightcap-accent mb-4">Comments</h2>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        className="mb-6"
      >
        {error && (
          <p className="text-red-400 text-sm mb-2" role="alert">
            {error}
          </p>
        )}
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Add a comment..."
          rows={2}
          className="w-full rounded-xl bg-nightcap/80 border border-white/10 px-4 py-3 text-white placeholder:text-nightcap-muted focus:border-nightcap-accent focus:outline-none resize-none"
        />
        <button
          type="submit"
          disabled={loading || !content.trim()}
          className="mt-2 rounded-xl bg-nightcap-accent px-5 py-2.5 font-medium text-white transition hover:opacity-90 disabled:opacity-50"
        >
          {loading ? "Posting..." : "Post comment"}
        </button>
      </form>

      <div className="space-y-4">
        {comments.map((c) => (
          <div
            key={c.id}
            className="glass rounded-xl p-4 flex gap-4"
          >
            <div className="relative w-10 h-10 rounded-full overflow-hidden bg-nightcap-muted flex-shrink-0">
              {c.profile?.avatar_url ? (
                <SafeImage
                  src={c.profile.avatar_url}
                  alt=""
                  fill
                  className="object-cover"
                  fallbackLetter={(c.profile?.display_name || "?")[0]}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-nightcap-accent font-display">
                  {(c.profile?.display_name || "?")[0].toUpperCase()}
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-nightcap-accent font-medium">
                  {c.profile?.display_name || "Anonymous"}
                </span>
                <span className="text-nightcap-muted text-sm">
                  {formatDateSafe(c.created_at, "MMM d, h:mm a")}
                </span>
                <span className="ml-auto flex items-center gap-1">
                  {c.user_id === currentUserId ? (
                    <button
                      type="button"
                      onClick={() => deleteComment(c.id)}
                      className="text-nightcap-muted hover:text-red-400 transition"
                    >
                      <Trash2 size={14} />
                    </button>
                  ) : (
                    <ReportBlockMenu
                      reportedUserId={c.user_id}
                      reportedUserName={c.profile?.display_name}
                      commentId={c.id}
                      variant="comment"
                    />
                  )}
                </span>
              </div>
              <p className="text-white mt-1">{c.content}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
