import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { BottomNav } from "@/components/BottomNav";
import { NotificationsList } from "@/components/NotificationsList";
import { getNotificationState } from "@/lib/notifications-server";

export default async function NotificationsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/signin");
  }

  const { notifications } = await getNotificationState(user.id);

  return (
    <div className="min-h-screen bg-nightcap page-with-nav">
      <nav className="glass sticky top-0 z-10 border-b border-white/5 safe-area-pt">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <Link href="/feed" className="text-nightcap-muted hover:text-white text-sm transition">
            ← Back
          </Link>
          <span className="font-display text-xl text-nightcap-accent">Notifications</span>
          <span className="w-12" />
        </div>
      </nav>

      <main className="mx-auto max-w-2xl px-4 py-8">
        <NotificationsList initialNotifications={notifications} />
      </main>
      <BottomNav />
    </div>
  );
}
