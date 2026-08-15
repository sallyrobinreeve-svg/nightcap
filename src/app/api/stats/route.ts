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

  const { data: stats, error } = await supabase
    .from("user_stats")
    .select("total_entries, avg_rating, total_rated_entries, kiss_count, top_club_name, top_club_visits, updated_at")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    stats: stats || {
      total_entries: 0,
      avg_rating: null,
      total_rated_entries: 0,
      kiss_count: 0,
      top_club_name: null,
      top_club_visits: 0,
      updated_at: null,
    },
  });
}
