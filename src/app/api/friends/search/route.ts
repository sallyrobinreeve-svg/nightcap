import { createClient } from "@/lib/supabase/server";
import { deriveFollowStatus } from "@/lib/friends";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const q = request.nextUrl.searchParams.get("q");
  if (!q || q.trim().length < 2) {
    return NextResponse.json({ users: [] });
  }

  const searchTerm = `%${q.trim()}%`;
  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("id, display_name, avatar_url")
    .neq("id", user.id)
    .ilike("display_name", searchTerm)
    .limit(20);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const ids = (profiles || []).map((p) => p.id);
  if (ids.length === 0) {
    return NextResponse.json({ users: profiles || [] });
  }

  const { data: outgoing } = await supabase
    .from("follows")
    .select("following_id, status")
    .eq("follower_id", user.id)
    .in("following_id", ids);

  const { data: incoming } = await supabase
    .from("follows")
    .select("follower_id, status")
    .eq("following_id", user.id)
    .in("follower_id", ids);

  const outgoingMap = new Map((outgoing || []).map((f) => [f.following_id, f]));
  const incomingMap = new Map((incoming || []).map((f) => [f.follower_id, f]));

  const users = (profiles || []).map((p) => {
    const out = outgoingMap.get(p.id) || null;
    const inc = incomingMap.get(p.id) || null;
    return {
      ...p,
      followStatus: deriveFollowStatus(out, inc),
      isFollowing: deriveFollowStatus(out, inc) === "accepted",
    };
  });

  return NextResponse.json({ users });
}
