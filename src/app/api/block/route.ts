import { createClient } from "@/lib/supabase/server";
import { notifyDeveloperOfBlock } from "@/lib/email";
import { toFriendlySupabaseMessage } from "@/lib/supabase-friendly-error";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { blocked_id } = await req.json();
  if (!blocked_id) return NextResponse.json({ error: "blocked_id required" }, { status: 400 });
  if (blocked_id === user.id) return NextResponse.json({ error: "Cannot block yourself" }, { status: 400 });

  const { error } = await supabase.from("blocks").insert({
    blocker_id: user.id,
    blocked_id,
  });

  if (error)
    return NextResponse.json({ error: toFriendlySupabaseMessage(error.message) }, { status: 500 });

  // Also create report so developer is notified (Guideline 1.2)
  await supabase.from("reports").insert({
    reporter_id: user.id,
    reported_user_id: blocked_id,
    reason: "User blocked for abusive behavior",
  });
  notifyDeveloperOfBlock({ blocker_id: user.id, blocked_id }).catch(() => {});

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const blocked_id = searchParams.get("blocked_id");
  if (!blocked_id) return NextResponse.json({ error: "blocked_id required" }, { status: 400 });

  const { error } = await supabase
    .from("blocks")
    .delete()
    .eq("blocker_id", user.id)
    .eq("blocked_id", blocked_id);

  if (error)
    return NextResponse.json({ error: toFriendlySupabaseMessage(error.message) }, { status: 500 });
  return NextResponse.json({ ok: true });
}
