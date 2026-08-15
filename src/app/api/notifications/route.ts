import { createClient } from "@/lib/supabase/server";
import { countUnread } from "@/lib/notifications";
import { getNotificationState } from "@/lib/notifications-server";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { notifications, lastSeen } = await getNotificationState(user.id);
  const unreadCount = countUnread(notifications, lastSeen);

  return NextResponse.json({ notifications, unreadCount, lastSeen });
}
