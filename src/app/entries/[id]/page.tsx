import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { canViewEntry } from "@/lib/entry-access";
import { formatDateSafe } from "@/lib/format-date";
import { ReactionBar } from "@/components/ReactionBar";
import { CommentSection } from "@/components/CommentSection";
import { DeleteEntryButton } from "@/components/DeleteEntryButton";
import { ReportBlockMenu } from "@/components/ReportBlockMenu";
import { EntryMediaImage } from "@/components/EntryMediaImage";
import { BottomNav } from "@/components/BottomNav";
import { PROMPTS } from "@/lib/prompts";

export default async function EntryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/signin");
  }

  const { data: entry, error } = await supabase
    .from("entries")
    .select(
      `
      id,
      user_id,
      date_of_night,
      rating,
      prompts,
      video_url,
      visibility,
      created_at,
      timeline_steps (
        id,
        type,
        emoji,
        location_name,
        time_at,
        notes,
        photo_url,
        sort_order
      ),
      photos (
        id,
        type,
        url
      )
    `
    )
    .eq("id", id)
    .single();

  if (error || !entry) {
    notFound();
  }

  const canView = await canViewEntry(supabase, user.id, entry);

  if (!canView) {
    notFound();
  }

  const { data: isBlocked } = await supabase
    .from("blocks")
    .select("blocker_id")
    .eq("blocker_id", user.id)
    .eq("blocked_id", entry.user_id)
    .maybeSingle();
  if (isBlocked) notFound();

  const { data: authorProfile } = await supabase
    .from("profiles")
    .select("id, display_name, avatar_url")
    .eq("id", entry.user_id)
    .maybeSingle();

  const { data: tags } = await supabase
    .from("entry_tags")
    .select("user_id")
    .eq("entry_id", id);
  const taggedIds = (tags || []).map((t) => t.user_id);
  let taggedProfiles: { id: string; display_name: string | null }[] = [];
  if (taggedIds.length > 0) {
    const { data } = await supabase
      .from("profiles")
      .select("id, display_name")
      .in("id", taggedIds);
    taggedProfiles = data || [];
  }

  const { data: reactions } = await supabase
    .from("reactions")
    .select("user_id, type")
    .eq("entry_id", id);

  const reactionCounts = (reactions || []).reduce(
    (acc, r) => {
      acc[r.type] = (acc[r.type] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const userReaction = (reactions || []).find((r) => r.user_id === user.id)?.type || null;

  const { data: commentsData } = await supabase
    .from("comments")
    .select("id, user_id, content, created_at")
    .eq("entry_id", id)
    .order("created_at", { ascending: true });

  const commentUserIds = Array.from(new Set((commentsData || []).map((c) => c.user_id)));
  const { data: commentProfiles } = commentUserIds.length > 0
    ? await supabase
        .from("profiles")
        .select("id, display_name, avatar_url")
        .in("id", commentUserIds)
    : { data: [] };
  const commentProfileMap = new Map((commentProfiles || []).map((p) => [p.id, p]));
  const comments = (commentsData || []).map((c) => ({
    ...c,
    profile: commentProfileMap.get(c.user_id),
  }));

  const timelineSteps = (
    (entry.timeline_steps as {
      type: string;
      emoji?: string | null;
      location_name: string | null;
      time_at: string | null;
      notes: string | null;
      photo_url?: string | null;
      sort_order: number;
    }[]) || []
  ).sort((a, b) => a.sort_order - b.sort_order);

  const photos = (entry.photos as { type: string; url: string }[]) || [];
  const outfitPhoto = photos.find((p) => p.type === "outfit");
  const favouritePhoto = photos.find((p) => p.type === "favourite");
  const videoUrl = (entry as { video_url?: string | null }).video_url;
  const prompts = (entry.prompts as Record<string, unknown>) || {};
  const isOwner = entry.user_id === user.id;

  return (
    <div className="min-h-screen bg-nightcap page-with-nav">
      <nav className="glass sticky top-0 z-10 border-b border-white/5 safe-area-pt">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <Link
            href="/feed"
            className="text-nightcap-muted hover:text-white text-sm transition"
          >
            ← Back
          </Link>
          <span className="font-display text-lg text-nightcap-accent">NightCapt</span>
          <div className="flex items-center gap-2">
            {isOwner && (
              <Link href={`/entries/${id}/edit`} className="text-nightcap-accent text-sm">
                Edit
              </Link>
            )}
            {!isOwner && (
              <ReportBlockMenu
                reportedUserId={entry.user_id}
                reportedUserName={authorProfile?.display_name}
                entryId={id}
              />
            )}
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-2xl px-4 py-8">
        <header className="mb-8">
          {entry.user_id !== user.id && authorProfile && (
            <Link
              href={`/profile/${authorProfile.id}`}
              className="text-nightcap-accent hover:underline text-sm mb-2 inline-block"
            >
              by {authorProfile.display_name || "Anonymous"}
            </Link>
          )}
          <h1 className="font-display text-3xl text-white">
            {formatDateSafe(entry.date_of_night, "EEEE, MMM d, yyyy")}
          </h1>
          {entry.rating && (
            <p className="text-nightcap-pink text-lg mt-2">{entry.rating} / 5 stars</p>
          )}
          {taggedProfiles.length > 0 && (
            <p className="text-nightcap-muted text-sm mt-2">
              Tagged:{" "}
              {taggedProfiles.map((p, i) => (
                <span key={p.id}>
                  {i > 0 && ", "}
                  <Link href={`/profile/${p.id}`} className="text-nightcap-accent hover:underline">
                    {p.display_name || "?"}
                  </Link>
                </span>
              ))}
            </p>
          )}
          <div className="mt-6 pt-6 border-t border-white/10">
            <h2 className="font-display text-lg text-nightcap-accent mb-4">React & comment</h2>
            <ReactionBar
              entryId={id}
              initialReactions={Object.entries(reactionCounts).map(([type, count]) => ({
                type,
                count,
              }))}
              userReaction={userReaction}
            />
          </div>
        </header>

        <div className="space-y-10">
          {(outfitPhoto || favouritePhoto || videoUrl) && (
            <section>
              <h2 className="font-display text-xl text-nightcap-accent mb-4">Media</h2>
              <div className="grid gap-6">
                {outfitPhoto && (
                  <EntryMediaImage
                    src={outfitPhoto.url}
                    alt="Outfit"
                    label="Outfit of the night"
                  />
                )}
                {favouritePhoto && (
                  <EntryMediaImage
                    src={favouritePhoto.url}
                    alt="Favourite"
                    label="Favourite photo"
                  />
                )}
                {videoUrl && (
                  <div className="sm:col-span-2">
                    <p className="text-nightcap-muted text-sm mb-2">Video</p>
                    <video
                      src={videoUrl}
                      controls
                      className="w-full max-h-96 rounded-2xl bg-nightcap-card"
                    />
                  </div>
                )}
              </div>
            </section>
          )}

          {Object.keys(prompts).filter((k) => !["kissedPrivate", "missionCompleted", "whoKissedWhoPrivate"].includes(k) && prompts[k] !== undefined && prompts[k] !== "" && prompts[k] !== null).length > 0 && (
            <section>
              <h2 className="font-display text-xl text-nightcap-accent mb-4">Prompts</h2>
              <div className="glass rounded-2xl p-6 space-y-4">
                {Object.entries(prompts)
                  .filter(([k, v]) => !["kissedPrivate", "missionCompleted", "whoKissedWhoPrivate"].includes(k) && v !== undefined && v !== "" && v !== null)
                  .map(([key, value]) => {
                  const def = PROMPTS.find((p) => p.id === key);
                  const label = def?.label ?? (key === "whoKissedWho" ? "Who kissed who" : key);
                  const displayValue = typeof value === "boolean"
                    ? def?.toggleLabels
                      ? value ? def.toggleLabels[0] : def.toggleLabels[1]
                      : String(value)
                    : String(value);
                  const isKissedPrivate = (key === "kissedAnyone" || key === "kissedWho" || key === "whoKissedWho") && (prompts.kissedPrivate || prompts.whoKissedWhoPrivate) && entry.user_id !== user.id;
                  if (isKissedPrivate) {
                    return (
                      <div key={key}>
                        <p className="text-nightcap-muted text-sm">{label}</p>
                        <p className="text-nightcap-muted italic">(Private)</p>
                      </div>
                    );
                  }
                  if ((key === "kissedAnyone" || key === "kissedWho" || key === "whoKissedWho") && (prompts.kissedPrivate || prompts.whoKissedWhoPrivate) && entry.user_id === user.id) {
                    return (
                      <div key={key}>
                        <p className="text-nightcap-muted text-sm">{label} (private)</p>
                        <p className="text-white">{displayValue}</p>
                      </div>
                    );
                  }
                  const isMission = key === "tonightsObjective";
                  const completed = isMission && prompts.missionCompleted === true;
                  const notCompleted = isMission && prompts.missionCompleted === false;
                  return (
                    <div key={key}>
                      <p className="text-nightcap-muted text-sm">{label}</p>
                      <p className="text-white">{displayValue}</p>
                      {isMission && (completed || notCompleted) && (
                        <p className="text-nightcap-muted text-xs mt-1">
                          {completed ? "Completed ✓" : "Not completed"}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {timelineSteps.length > 0 && (
            <section>
              <h2 className="font-display text-xl text-nightcap-accent mb-4">Timeline</h2>
              <div className="relative">
                <div className="absolute left-4 top-0 bottom-0 w-px bg-nightcap-muted/50" />
                <div className="space-y-6">
                  {timelineSteps.map((step, i) => (
                    <div key={i} className="flex gap-4 pl-12 relative">
                      <div className="absolute left-2.5 top-2 w-3 h-3 rounded-full bg-nightcap-accent" />
                      <div className="glass rounded-xl p-4 flex-1">
                        <p className="font-medium text-white capitalize">
                          {step.emoji && `${step.emoji} `}{step.type}
                        </p>
                        {step.location_name && (
                          <p className="text-nightcap-pink">{step.location_name}</p>
                        )}
                        {step.time_at && (
                          <p className="text-nightcap-muted text-sm mt-1">
                            {String(step.time_at).slice(0, 5)}
                          </p>
                        )}
                        {step.notes && (
                          <p className="text-nightcap-muted text-sm mt-2">{step.notes}</p>
                        )}
                        {step.photo_url && (
                          <div className="mt-3">
                            <EntryMediaImage src={step.photo_url} alt={`${step.type} photo`} />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {!isOwner && (
            <section className="flex justify-end pt-2 border-t border-white/5">
              <ReportBlockMenu
                reportedUserId={entry.user_id}
                reportedUserName={authorProfile?.display_name}
                entryId={id}
              />
            </section>
          )}

          <CommentSection
            entryId={id}
            currentUserId={user.id}
            initialComments={comments}
          />
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
