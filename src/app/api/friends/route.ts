import { createClient } from "@/lib/supabase/server";
import { acceptedFriendIdsFromRows } from "@/lib/friends";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: friendRows, error: followsError } = await supabase
    .from("follows")
    .select("follower_id, following_id, status")
    .eq("status", "accepted")
    .or(`follower_id.eq.${user.id},following_id.eq.${user.id}`);

  if (followsError) {
    return NextResponse.json({ error: followsError.message }, { status: 500 });
  }

  const ids = Array.from(acceptedFriendIdsFromRows(friendRows || [], user.id));
  if (ids.length === 0) {
    return NextResponse.json({ friends: [] });
  }

  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select("id, display_name, avatar_url")
    .in("id", ids);

  if (profilesError) {
    return NextResponse.json({ error: profilesError.message }, { status: 500 });
  }

  return NextResponse.json({ friends: profiles || [] });
}
