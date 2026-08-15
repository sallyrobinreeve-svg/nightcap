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

    if (!userId || typeof userId !== "string" || userId === user.id) {
      return NextResponse.json({ error: "Invalid user" }, { status: 400 });
    }

    const { data: existing } = await supabase
      .from("follows")
      .select("status")
      .eq("follower_id", user.id)
      .eq("following_id", userId)
      .maybeSingle();

    if (existing?.status === "accepted") {
      return NextResponse.json({ message: "Already friends", status: "accepted" });
    }
    if (existing?.status === "pending") {
      return NextResponse.json({ message: "Request already sent", status: "pending_out" });
    }

    if (existing?.status === "rejected") {
      const { error } = await supabase
        .from("follows")
        .update({ status: "pending" })
        .eq("follower_id", user.id)
        .eq("following_id", userId);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      return NextResponse.json({ success: true, status: "pending_out" });
    }

    const { error } = await supabase.from("follows").insert({
      follower_id: user.id,
      following_id: userId,
      status: "pending",
    });

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json({ message: "Request already sent", status: "pending_out" });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, status: "pending_out" });
  } catch (err) {
    console.error("[follow] Error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Follow failed" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = request.nextUrl.searchParams.get("userId");
  if (!userId) {
    return NextResponse.json({ error: "Missing userId" }, { status: 400 });
  }

  // Remove both directions of friendship / requests
  const { error: err1 } = await supabase
    .from("follows")
    .delete()
    .eq("follower_id", user.id)
    .eq("following_id", userId);

  const { error: err2 } = await supabase
    .from("follows")
    .delete()
    .eq("follower_id", userId)
    .eq("following_id", user.id);

  if (err1 && err2) {
    return NextResponse.json({ error: err1.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, status: "none" });
}
