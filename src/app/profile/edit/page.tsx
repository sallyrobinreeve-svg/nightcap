import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProfileEditForm } from "@/components/ProfileEditForm";

export default async function ProfileEditPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/signin");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, avatar_url, bio")
    .eq("id", user.id)
    .maybeSingle();

  return (
    <ProfileEditForm
      userId={user.id}
      displayName={profile?.display_name ?? null}
      avatarUrl={profile?.avatar_url ?? null}
      bio={profile?.bio ?? null}
    />
  );
}
