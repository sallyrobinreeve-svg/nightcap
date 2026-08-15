import Link from "next/link";
import { redirect } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { formatDateSafe } from "@/lib/format-date";
import { BottomNav } from "@/components/BottomNav";

export default async function MemoriesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/signin");
  }

  const { data: entries } = await supabase
    .from("entries")
    .select("id, date_of_night, rating, created_at")
    .eq("user_id", user.id)
    .order("date_of_night", { ascending: false });

  const { data: photos } = entries?.length
    ? await supabase
        .from("photos")
        .select("entry_id, url, type")
        .in(
          "entry_id",
          (entries || []).map((e) => e.id)
        )
    : { data: [] };

  const entryPhotos = new Map<string, string>();
  (photos || []).forEach((p) => {
    if ((p.type === "favourite" || p.type === "outfit") && !entryPhotos.has(p.entry_id)) {
      entryPhotos.set(p.entry_id, p.url);
    }
  });

  return (
    <div className="min-h-screen bg-nightcap pb-24">
      <div className="glass sticky top-0 z-10 border-b border-white/5">
        <div className="mx-auto flex h-14 max-w-lg items-center justify-between px-4">
          <h1 className="font-display text-xl text-white">Memories</h1>
          <Link href="/friends" className="text-nightcap-muted text-sm hover:text-white">
            Friends
          </Link>
        </div>
      </div>

      <main className="mx-auto max-w-lg px-4 py-6">
        <p className="text-nightcap-muted text-sm mb-6">
          Your photo grid and calendar of past nights
        </p>

        {!entries?.length ? (
          <div className="glass rounded-2xl p-12 text-center">
            <p className="text-nightcap-muted mb-6">No nights yet. Capture the chaos!</p>
            <Link
              href="/entries/new"
              className="inline-flex rounded-full bg-nightcap-accent px-6 py-3 font-medium text-white transition hover:opacity-90"
            >
              Create first night
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {(entries || []).map((e) => (
              <Link
                key={e.id}
                href={`/entries/${e.id}`}
                className="group block aspect-square rounded-2xl overflow-hidden border-2 border-white/5 transition hover:border-nightcap-accent/50"
              >
                <div className="relative w-full h-full bg-nightcap-card">
                  {entryPhotos.get(e.id) ? (
                    <Image
                      src={entryPhotos.get(e.id)!}
                      alt=""
                      fill
                      className="object-cover group-hover:scale-105 transition"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-nightcap-muted p-2">
                      <span className="font-display text-2xl">{e.rating || "–"}</span>
                      <span className="text-xs">{formatDateSafe(e.date_of_night, "MMM d")}</span>
                    </div>
                  )}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                    <p className="text-white text-xs font-medium truncate">
                      {formatDateSafe(e.date_of_night, "MMM d, yyyy")}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
