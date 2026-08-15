import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: pending, error } = await supabase
    .from("follows")
    .select("follower_id, created_at")
    .eq("following_id", user.id)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const ids = (pending || []).map((p) => p.follower_id);
  if (ids.length === 0) {
    return NextResponse.json({ requests: [] });
  }

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, display_name, avatar_url")
    .in("id", ids);

  const profileMap = new Map((profiles || []).map((p) => [p.id, p]));

  const requests = (pending || []).map((p) => ({
    userId: p.follower_id,
    createdAt: p.created_at,
    profile: profileMap.get(p.follower_id) || null,
  }));

  return NextResponse.json({ requests });
}
