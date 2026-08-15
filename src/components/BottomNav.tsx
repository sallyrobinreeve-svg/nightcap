"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, PlusCircle, Images, User, Bell } from "lucide-react";
import { useEffect, useState } from "react";

function NavBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span className="absolute top-1 right-3 flex h-4 min-w-4 items-center justify-center rounded-full bg-nightcap-accent px-1 text-[9px] font-bold text-white">
      {count > 99 ? "99+" : count}
    </span>
  );
}

export function BottomNav() {
  const pathname = usePathname();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const res = await fetch("/api/notifications");
        if (!res.ok) return;
        const data = (await res.json()) as { unreadCount?: number };
        if (!cancelled) setUnreadCount(data.unreadCount ?? 0);
      } catch {
        // ignore
      }
    };

    void load();
    const interval = setInterval(load, 60_000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [pathname]);

  const isActive = (path: string) => {
    if (path === "/feed") {
      return pathname === "/" || pathname === "/feed" || pathname.startsWith("/entries/");
    }
    return pathname.startsWith(path);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass border-t border-white/5 safe-area-pb">
      <div className="mx-auto flex max-w-lg items-center justify-around px-2 py-3">
        <Link
          href="/feed"
          className={`relative flex flex-col items-center gap-1 rounded-xl px-4 py-2 transition ${
            isActive("/feed") ? "text-nightcap-accent" : "text-nightcap-muted hover:text-white"
          }`}
        >
          <Home size={22} />
          <span className="text-xs font-medium">Feed</span>
        </Link>
        <Link
          href="/notifications"
          className={`relative flex flex-col items-center gap-1 rounded-xl px-4 py-2 transition ${
            isActive("/notifications") ? "text-nightcap-accent" : "text-nightcap-muted hover:text-white"
          }`}
        >
          <Bell size={22} />
          <NavBadge count={unreadCount} />
          <span className="text-xs font-medium">Alerts</span>
        </Link>
        <Link
          href="/entries/new"
          className="flex flex-col items-center gap-1 rounded-2xl bg-nightcap-accent px-5 py-2.5 transition hover:scale-105 hover:shadow-lg hover:shadow-nightcap-accent/30"
        >
          <PlusCircle size={26} className="mb-0.5 text-white" />
          <span className="text-xs font-medium text-white">Create</span>
        </Link>
        <Link
          href="/memories"
          className={`flex flex-col items-center gap-1 rounded-xl px-4 py-2 transition ${
            isActive("/memories") ? "text-nightcap-accent" : "text-nightcap-muted hover:text-white"
          }`}
        >
          <Images size={22} />
          <span className="text-xs font-medium">Memories</span>
        </Link>
        <Link
          href="/profile"
          className={`flex flex-col items-center gap-1 rounded-xl px-4 py-2 transition ${
            isActive("/profile") ? "text-nightcap-accent" : "text-nightcap-muted hover:text-white"
          }`}
        >
          <User size={22} />
          <span className="text-xs font-medium">Profile</span>
        </Link>
      </div>
    </nav>
  );
}
