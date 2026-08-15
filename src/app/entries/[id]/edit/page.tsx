import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { EntryWizard } from "@/components/EntryWizard";
import type { WizardData } from "@/components/EntryWizard";
import type { TimelineStep } from "@/types/database";

export default async function EditEntryPage({
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
      timeline_steps (id, type, emoji, location_name, time_at, notes, photo_url, sort_order),
      photos (type, url)
    `
    )
    .eq("id", id)
    .single();

  if (error || !entry) {
    notFound();
  }

  if (entry.user_id !== user.id) {
    notFound();
  }

  const photos = (entry.photos as { type: string; url: string }[]) || [];
  const outfitPhoto = photos.find((p) => p.type === "outfit");
  const favouritePhoto = photos.find((p) => p.type === "favourite");

  const timelineSteps = (
    (entry.timeline_steps as {
      id: string;
      type: string;
      emoji?: string | null;
      location_name: string | null;
      time_at: string | null;
      notes: string | null;
      photo_url?: string | null;
      sort_order: number;
    }[]) || []
  ).sort((a, b) => a.sort_order - b.sort_order);

  const { data: tags } = await supabase
    .from("entry_tags")
    .select("user_id")
    .eq("entry_id", id);
  const taggedUserIds = (tags || []).map((t) => t.user_id);

  const prompts = (entry.prompts as Record<string, unknown>) || {};
  const kissedPrivate = prompts.kissedPrivate === true || prompts.whoKissedWhoPrivate === true;

  const initialData: Partial<WizardData> = {
    dateOfNight: entry.date_of_night,
    outfitPhotoUrl: outfitPhoto?.url ?? null,
    favouritePhotoUrl: favouritePhoto?.url ?? null,
    videoUrl: (entry as { video_url?: string | null }).video_url ?? null,
    rating: entry.rating ?? null,
    prompts: prompts as WizardData["prompts"],
    kissedPrivate,
    timelineSteps: timelineSteps.map((s) => ({
      id: s.id,
      entry_id: id,
      type: s.type as TimelineStep["type"],
      emoji: s.emoji ?? null,
      location_name: s.location_name ?? null,
      time_at: s.time_at ?? null,
      notes: s.notes ?? null,
      photo_url: s.photo_url ?? null,
      sort_order: s.sort_order,
      created_at: new Date().toISOString(),
    })),
    taggedUserIds,
    visibility: (entry.visibility as "private" | "friends" | "public") || "friends",
  };

  return (
    <div className="min-h-screen bg-nightcap pb-24">
      <nav className="glass sticky top-0 z-10 border-b border-white/5">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Link href={`/entries/${id}`} className="font-display text-2xl text-nightcap-accent hover:opacity-90">
            ← Back
          </Link>
        </div>
      </nav>

      <main className="mx-auto max-w-2xl px-4 py-12">
        <h1 className="font-display text-4xl text-white mb-2">Edit entry</h1>
        <p className="text-nightcap-muted mb-8">
          Update your night out recap.
        </p>
        <EntryWizard
          userId={user.id}
          entryId={id}
          initialData={initialData}
        />
      </main>
    </div>
  );
}
