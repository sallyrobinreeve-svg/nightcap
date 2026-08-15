import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { containsObjectionableContentInObject } from "@/lib/content-filter";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const {
    userId,
    dateOfNight,
    outfitPhotoUrl,
    favouritePhotoUrl,
    videoUrl,
    rating,
    prompts,
    kissedPrivate,
    timelineSteps,
    taggedUserIds,
    visibility,
  } = body;

  if (userId !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!dateOfNight) {
    return NextResponse.json(
      { error: "Date of night is required" },
      { status: 400 }
    );
  }

  const promptsData = { ...prompts };
  if (kissedPrivate && (promptsData.kissedAnyone || promptsData.kissedWho)) {
    promptsData.kissedPrivate = true;
  }

  if (containsObjectionableContentInObject(promptsData)) {
    return NextResponse.json(
      { error: "Content violates our community guidelines" },
      { status: 400 }
    );
  }
  if (timelineSteps?.some((s: { notes?: string }) => containsObjectionableContentInObject(s?.notes))) {
    return NextResponse.json(
      { error: "Content violates our community guidelines" },
      { status: 400 }
    );
  }

  const { data: entry, error: entryError } = await supabase
    .from("entries")
    .insert({
      user_id: user.id,
      date_of_night: dateOfNight,
      rating: rating ?? null,
      prompts: promptsData,
      video_url: videoUrl || null,
      visibility: visibility || "friends",
    })
    .select("id")
    .single();

  if (entryError) {
    return NextResponse.json(
      { error: entryError.message || "Failed to create entry" },
      { status: 500 }
    );
  }

  const entryId = entry.id;

  if (outfitPhotoUrl) {
    await supabase.from("photos").insert({
      entry_id: entryId,
      type: "outfit",
      url: outfitPhotoUrl,
    });
  }

  if (favouritePhotoUrl) {
    await supabase.from("photos").insert({
      entry_id: entryId,
      type: "favourite",
      url: favouritePhotoUrl,
    });
  }

  if (timelineSteps?.length > 0) {
    const steps = timelineSteps.map(
      (
        s: {
          type: string;
          emoji?: string | null;
          location_name: string | null;
          time_at: string | null;
          notes: string | null;
          sort_order: number;
        },
        i: number
      ) => ({
        entry_id: entryId,
        type: s.type,
        emoji: s.emoji || null,
        location_name: s.location_name || null,
        time_at: s.time_at || null,
        notes: s.notes || null,
        sort_order: i,
      })
    );
    await supabase.from("timeline_steps").insert(steps);
  }

  if (taggedUserIds?.length > 0) {
    const tags = taggedUserIds.map((uid: string) => ({
      entry_id: entryId,
      user_id: uid,
    }));
    await supabase.from("entry_tags").insert(tags);
  }

  return NextResponse.json({ id: entryId });
}
