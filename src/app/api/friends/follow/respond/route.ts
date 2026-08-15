import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const userId = body?.userId;
    const action = body?.action;

    if (!userId || typeof userId !== "string" || userId === user.id) {
      return NextResponse.json({ error: "Invalid user" }, { status: 400 });
    }
    if (action !== "accept" && action !== "reject") {
      return NextResponse.json({ error: "action must be accept or reject" }, { status: 400 });
    }

    const { data: requestRow } = await supabase
      .from("follows")
      .select("status")
      .eq("follower_id", userId)
      .eq("following_id", user.id)
      .maybeSingle();

    if (!requestRow || requestRow.status !== "pending") {
      return NextResponse.json({ error: "No pending request from this user" }, { status: 400 });
    }

    if (action === "reject") {
      const { error } = await supabase
        .from("follows")
        .update({ status: "rejected" })
        .eq("follower_id", userId)
        .eq("following_id", user.id);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      return NextResponse.json({ success: true, status: "rejected" });
    }

    // Accept: confirm their request and add mutual friendship so both feeds update
    const { error: acceptError } = await supabase
      .from("follows")
      .update({ status: "accepted" })
      .eq("follower_id", userId)
      .eq("following_id", user.id);

    if (acceptError) {
      return NextResponse.json({ error: acceptError.message }, { status: 500 });
    }

    const { data: reverse } = await supabase
      .from("follows")
      .select("status")
      .eq("follower_id", user.id)
      .eq("following_id", userId)
      .maybeSingle();

    if (reverse) {
      await supabase
        .from("follows")
        .update({ status: "accepted" })
        .eq("follower_id", user.id)
        .eq("following_id", userId);
    } else {
      await supabase.from("follows").insert({
        follower_id: user.id,
        following_id: userId,
        status: "accepted",
      });
    }

    return NextResponse.json({ success: true, status: "accepted" });
  } catch (err) {
    console.error("[follow/respond] Error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Request failed" },
      { status: 500 }
    );
  }
}
