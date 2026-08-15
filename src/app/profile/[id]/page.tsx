import Link from "next/link";
import { SafeImage } from "@/components/SafeImage";
import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { deriveFollowStatus } from "@/lib/friends";
import { FollowButton } from "@/components/FollowButton";
import { ReportBlockMenu } from "@/components/ReportBlockMenu";

export default async function UserProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/signin");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, display_name, avatar_url, bio")
    .eq("id", id)
    .maybeSingle();

  if (!profile) {
    notFound();
  }

  const { count } = await supabase
    .from("entries")
    .select("id", { count: "exact", head: true })
    .eq("user_id", id)
    .in("visibility", ["public", "friends"]);

  const { data: outgoing } = await supabase
    .from("follows")
    .select("status")
    .eq("follower_id", user.id)
    .eq("following_id", id)
    .maybeSingle();

  const { data: incoming } = await supabase
    .from("follows")
    .select("status")
    .eq("follower_id", id)
    .eq("following_id", user.id)
    .maybeSingle();

  const followStatus = deriveFollowStatus(outgoing, incoming);

  return (
    <div className="min-h-screen bg-nightcap">
      <nav className="glass sticky top-0 z-10 border-b border-white/5">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Link href="/" className="font-display text-2xl text-nightcap-accent">
            NightCapt
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/feed" className="text-nightcap-muted hover:text-white transition">
              Feed
            </Link>
            <Link href="/friends" className="text-nightcap-muted hover:text-white transition">
              Friends
            </Link>
            <Link href="/profile" className="text-nightcap-muted hover:text-white transition">
              My profile
            </Link>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-2xl px-4 py-12">
        <div className="glass rounded-2xl p-8">
          <div className="flex items-start gap-6">
            <div className="relative w-24 h-24 rounded-full overflow-hidden bg-nightcap-muted flex-shrink-0">
              {profile.avatar_url ? (
                <SafeImage
                  src={profile.avatar_url}
                  alt=""
                  fill
                  className="object-cover"
                  fallbackLetter={(profile.display_name || "?")[0]}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-nightcap-accent font-display text-3xl">
                  {(profile.display_name || "?")[0].toUpperCase()}
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="font-display text-3xl text-white">
                {profile.display_name || "Anonymous"}
              </h1>
              {profile.bio && (
                <p className="text-nightcap-muted mt-4">{profile.bio}</p>
              )}
              <p className="text-nightcap-accent font-medium mt-4">
                {count ?? 0} {count === 1 ? "entry" : "entries"}
              </p>
              {id !== user.id && (
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <FollowButton userId={id} followStatus={followStatus} />
                  <ReportBlockMenu
                    reportedUserId={id}
                    reportedUserName={profile.display_name}
                    variant="profile"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
