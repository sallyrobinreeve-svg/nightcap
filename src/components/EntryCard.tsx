import Link from "next/link";
import { formatDateSafe } from "@/lib/format-date";
import { SafeImage } from "@/components/SafeImage";
import { ReportBlockMenu } from "@/components/ReportBlockMenu";
import { MessageCircle, Flame } from "lucide-react";

interface EntryCardProps {
  entry: {
    id: string;
    user_id: string;
    date_of_night: string;
    rating: number | null;
    prompts?: Record<string, unknown>;
    profile?: { id: string; display_name: string | null; avatar_url: string | null };
    thumbnailUrl?: string | null;
    reactionCount?: number;
    commentCount?: number;
  };
  currentUserId: string;
}

export function EntryCard({ entry, currentUserId }: EntryCardProps) {
  const isOwn = entry.user_id === currentUserId;
  const mission = entry.prompts?.mission as string | undefined;

  return (
    <div className="glass rounded-2xl hover-lift overflow-hidden transition hover:border-nightcap-accent/30 relative">
      {!isOwn && (
        <div className="absolute top-3 right-3 z-10">
          <ReportBlockMenu
            reportedUserId={entry.user_id}
            reportedUserName={entry.profile?.display_name}
            entryId={entry.id}
          />
        </div>
      )}
      <div className="flex gap-4 p-6">
        <Link
          href={`/entries/${entry.id}`}
          className="relative w-24 h-24 rounded-xl overflow-hidden bg-nightcap-muted flex-shrink-0"
        >
          {entry.thumbnailUrl ? (
            <SafeImage
              src={entry.thumbnailUrl}
              alt=""
              fill
              className="object-cover"
              fallbackLetter={(entry.profile?.display_name || entry.rating || "?").toString()}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-nightcap-muted text-2xl">
              {entry.rating || "–"}
            </div>
          )}
        </Link>
        <div className="flex-1 min-w-0">
          <Link
            href={`/entries/${entry.id}`}
            className="font-display text-xl text-white hover:text-nightcap-accent transition"
          >
            {formatDateSafe(entry.date_of_night, "EEEE, MMM d, yyyy")}
          </Link>
          {!isOwn && entry.profile && (
            <Link
              href={`/profile/${entry.profile.id}`}
              className="text-nightcap-accent hover:underline text-sm mt-1 block"
            >
              by {entry.profile.display_name || "Anonymous"}
            </Link>
          )}
          {entry.rating && (
            <p className="text-nightcap-pink text-sm mt-1">{entry.rating} / 5 stars</p>
          )}
          {mission && (
            <p className="text-nightcap-muted text-sm mt-1 line-clamp-1">Mission: {mission}</p>
          )}
          <div className="flex gap-4 mt-2 text-nightcap-muted text-sm">
            <span className="flex items-center gap-1">
              <Flame size={14} />
              {entry.reactionCount || 0}
            </span>
            <span className="flex items-center gap-1">
              <MessageCircle size={14} />
              {entry.commentCount || 0}
            </span>
          </div>
          <Link
            href={`/entries/${entry.id}`}
            className="inline-block mt-3 text-sm text-nightcap-accent hover:underline"
          >
            View photos · React & comment →
          </Link>
        </div>
      </div>
    </div>
  );
}
