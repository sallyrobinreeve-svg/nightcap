import { createClient } from "@/lib/supabase/server";
import { toFriendlySupabaseMessage } from "@/lib/supabase-friendly-error";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const type = formData.get("type") as string | null;

  if (!file || !type || !["outfit", "favourite", "step", "video", "avatar"].includes(type)) {
    return NextResponse.json(
      { error: "Invalid file or type" },
      { status: 400 }
    );
  }

  const ext = file.name.split(".").pop() || "jpg";
  const path = type === "avatar"
    ? `${user.id}/avatar-${Date.now()}.${ext}`
    : `${user.id}/${Date.now()}-${type}.${ext}`;

  const buffer = await file.arrayBuffer();
  const { error } = await supabase.storage.from("photos").upload(path, buffer, {
    contentType: file.type,
    upsert: false,
  });

  if (error) {
    return NextResponse.json(
      { error: toFriendlySupabaseMessage(error.message || "Upload failed") },
      { status: 500 }
    );
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from("photos").getPublicUrl(path);

  return NextResponse.json({ url: publicUrl });
}
