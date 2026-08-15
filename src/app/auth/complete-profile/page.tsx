"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { toFriendlySupabaseMessage } from "@/lib/supabase-friendly-error";

export default function CompleteProfilePage() {
  const [displayName, setDisplayName] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        window.location.href = "/auth/signin";
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("display_name, terms_accepted_at")
        .eq("id", user.id)
        .maybeSingle();

      if (profile?.display_name && profile?.terms_accepted_at) {
        window.location.href = "/";
        return;
      }

      if (profile?.display_name) {
        setDisplayName(profile.display_name);
      }
      setChecking(false);
    };

    void load();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) {
      setError("Choose a display name so friends can find you.");
      return;
    }
    if (!acceptedTerms) {
      setError("You must agree to the Terms of Use and Privacy Policy");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        window.location.href = "/auth/signin";
        return;
      }

      const termsAcceptedAt = new Date().toISOString();
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          display_name: displayName.trim(),
          terms_accepted_at: termsAcceptedAt,
        })
        .eq("id", user.id);
      if (updateError) throw updateError;

      await supabase.auth.updateUser({
        data: { full_name: displayName.trim(), terms_accepted_at: termsAcceptedAt },
      });

      window.location.href = "/";
    } catch (err) {
      const text = err instanceof Error ? err.message : "Could not save profile.";
      setError(toFriendlySupabaseMessage(text));
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen bg-nightcap flex items-center justify-center px-4">
        <p className="text-nightcap-muted">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-nightcap flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <Link href="/" className="inline-block font-display text-2xl text-nightcap-accent mb-8">
          NightCapt
        </Link>
        <div className="glass rounded-2xl p-8">
          <h1 className="font-display text-3xl text-white mb-2">Finish signing up</h1>
          <p className="text-nightcap-muted text-sm mb-6">
            Your number is verified. Add a name so friends can find you.
          </p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="displayName" className="block text-sm text-nightcap-muted mb-2">
                Display name
              </label>
              <input
                id="displayName"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
                className="w-full rounded-xl bg-nightcap/80 border border-white/10 px-4 py-3 text-white placeholder:text-nightcap-muted focus:border-nightcap-accent focus:outline-none"
                placeholder="Your name"
              />
            </div>
            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={acceptedTerms}
                onChange={(e) => setAcceptedTerms(e.target.checked)}
                className="mt-1 rounded border-white/20"
              />
              <span className="text-sm text-nightcap-muted">
                I agree to the{" "}
                <Link href="/privacy" className="text-nightcap-accent hover:underline">
                  Terms of Use, Privacy Policy and Support
                </Link>
                . I understand there is zero tolerance for objectionable content.
              </span>
            </label>
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <button
              type="submit"
              disabled={loading || !acceptedTerms}
              className="w-full rounded-xl bg-nightcap-accent px-4 py-3 font-medium text-white transition hover:opacity-90 disabled:opacity-50"
            >
              {loading ? "Saving..." : "Continue"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
