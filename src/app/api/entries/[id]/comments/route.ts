import { createClient } from "@/lib/supabase/server";
import { toFriendlySupabaseMessage } from "@/lib/supabase-friendly-error";
import { NextRequest, NextResponse } from "next/server";
import { containsObjectionableContent } from "@/lib/content-filter";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: entryId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: comments, error } = await supabase
    .from("comments")
    .select("id, user_id, content, created_at")
    .eq("entry_id", entryId)
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: toFriendlySupabaseMessage(error.message) }, { status: 500 });
  }

  const userIds = Array.from(new Set((comments || []).map((c) => c.user_id)));
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, display_name, avatar_url")
    .in("id", userIds);

  const profileMap = new Map((profiles || []).map((p) => [p.id, p]));

  const commentsWithProfiles = (comments || []).map((c) => ({
    ...c,
    profile: profileMap.get(c.user_id),
  }));

  return NextResponse.json({ comments: commentsWithProfiles });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: entryId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { content } = body;

  if (!content || typeof content !== "string" || content.trim().length === 0) {
    return NextResponse.json({ error: "Content required" }, { status: 400 });
  }

  if (containsObjectionableContent(content)) {
    return NextResponse.json({ error: "Content violates our community guidelines" }, { status: 400 });
  }

  const { data: comment, error } = await supabase
    .from("comments")
    .insert({
      entry_id: entryId,
      user_id: user.id,
      content: content.trim().slice(0, 2000),
    })
    .select("id, user_id, content, created_at")
    .single();

  if (error) {
    return NextResponse.json({ error: toFriendlySupabaseMessage(error.message) }, { status: 500 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, display_name, avatar_url")
    .eq("id", user.id)
    .maybeSingle();

  return NextResponse.json({
    comment: { ...comment, profile },
  });
}
