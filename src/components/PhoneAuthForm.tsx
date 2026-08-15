"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { COUNTRIES, DEFAULT_COUNTRY_ISO, countryByIso, formatPhoneForDisplay, parsePhoneInput } from "@/lib/phone";
import { toFriendlySupabaseMessage } from "@/lib/supabase-friendly-error";
import { createClient } from "@/lib/supabase/client";

const RESEND_SECONDS = 60;

type Step = "phone" | "code";
type Mode = "signin" | "signup";

type PhoneAuthFormProps = {
  mode: Mode;
};

async function isProfileComplete(): Promise<boolean> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, terms_accepted_at")
    .eq("id", user.id)
    .maybeSingle();

  return Boolean(profile?.display_name && profile?.terms_accepted_at);
}

export function PhoneAuthForm({ mode }: PhoneAuthFormProps) {
  const [step, setStep] = useState<Step>("phone");
  const [countryIso, setCountryIso] = useState(DEFAULT_COUNTRY_ISO);
  const [nationalNumber, setNationalNumber] = useState("");
  const [e164, setE164] = useState("");
  const [code, setCode] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [resendIn, setResendIn] = useState(0);

  const country = countryByIso(countryIso);
  const isSignup = mode === "signup";

  useEffect(() => {
    if (resendIn <= 0) return;
    const timer = window.setTimeout(() => setResendIn((value) => value - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [resendIn]);

  const sendCode = async (phone: string, metadata?: Record<string, string>) => {
    const supabase = createClient();
    const { error: sendError } = await supabase.auth.signInWithOtp({
      phone,
      options: {
        channel: "sms",
        shouldCreateUser: true,
        ...(metadata ? { data: metadata } : {}),
      },
    });
    if (sendError) {
      throw sendError;
    }
  };

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (isSignup && !acceptedTerms) {
      setError("You must agree to the Terms of Use and Privacy Policy");
      return;
    }

    const parsed = parsePhoneInput(country.dial, nationalNumber);
    if (!parsed) {
      setError("Enter a valid mobile number.");
      return;
    }

    setLoading(true);
    try {
      const metadata =
        isSignup && displayName.trim()
          ? {
              full_name: displayName.trim(),
              terms_accepted_at: new Date().toISOString(),
            }
          : undefined;
      await sendCode(parsed, metadata);
      setE164(parsed);
      setStep("code");
      setResendIn(RESEND_SECONDS);
      setMessage(`We sent a 6-digit code to ${formatPhoneForDisplay(parsed)}.`);
    } catch (err) {
      const text = err instanceof Error ? err.message : "Could not send code.";
      setError(toFriendlySupabaseMessage(text));
    } finally {
      setLoading(false);
    }
  };

  const finishAuth = async () => {
    const complete = await isProfileComplete();
    window.location.href = complete ? "/" : "/auth/complete-profile";
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    const token = code.replace(/\D/g, "");
    if (token.length !== 6) {
      setError("Enter the 6-digit code from your text.");
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      const { data, error: verifyError } = await supabase.auth.verifyOtp({
        phone: e164,
        token,
        type: "sms",
      });
      if (verifyError) throw verifyError;

      if (isSignup && data.user) {
        const termsAcceptedAt = new Date().toISOString();
        await supabase
          .from("profiles")
          .update({
            display_name: displayName.trim() || null,
            terms_accepted_at: termsAcceptedAt,
          })
          .eq("id", data.user.id);
      }

      setMessage("You're in. Redirecting...");
      await finishAuth();
    } catch (err) {
      const text = err instanceof Error ? err.message : "Could not verify code.";
      setError(toFriendlySupabaseMessage(text));
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendIn > 0 || loading) return;
    setError(null);
    setLoading(true);
    try {
      await sendCode(e164);
      setResendIn(RESEND_SECONDS);
      setMessage("Sent a new code.");
    } catch (err) {
      const text = err instanceof Error ? err.message : "Could not resend code.";
      setError(toFriendlySupabaseMessage(text));
    } finally {
      setLoading(false);
    }
  };

  if (step === "code") {
    return (
      <form onSubmit={handleVerify} className="space-y-4">
        <p className="text-sm text-nightcap-muted">
          Code sent to <span className="text-white">{formatPhoneForDisplay(e164)}</span>
          {" · "}
          <button
            type="button"
            onClick={() => {
              setStep("phone");
              setCode("");
              setError(null);
              setMessage(null);
            }}
            className="text-nightcap-accent hover:underline"
          >
            Change number
          </button>
        </p>
        <div>
          <label htmlFor="otp" className="block text-sm text-nightcap-muted mb-2">
            6-digit code
          </label>
          <input
            id="otp"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]*"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            required
            autoFocus
            className="w-full rounded-xl bg-nightcap/80 border border-white/10 px-4 py-3 text-white tracking-[0.4em] text-center text-2xl placeholder:text-nightcap-muted focus:border-nightcap-accent focus:outline-none"
            placeholder="000000"
          />
        </div>
        {error && <p className="text-red-400 text-sm">{error}</p>}
        {message && <p className="text-nightcap-blue text-sm">{message}</p>}
        <button
          type="submit"
          disabled={loading || code.length !== 6}
          className="w-full rounded-xl bg-nightcap-accent px-4 py-3 font-medium text-white transition hover:opacity-90 disabled:opacity-50"
        >
          {loading ? "Verifying..." : "Continue"}
        </button>
        <button
          type="button"
          onClick={handleResend}
          disabled={loading || resendIn > 0}
          className="w-full text-sm text-nightcap-muted hover:text-nightcap-accent disabled:opacity-50"
        >
          {resendIn > 0 ? `Resend code in ${resendIn}s` : "Resend code"}
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={handleSendCode} className="space-y-4">
      {isSignup && (
        <div>
          <label htmlFor="displayName" className="block text-sm text-nightcap-muted mb-2">
            Display name
          </label>
          <input
            id="displayName"
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="w-full rounded-xl bg-nightcap/80 border border-white/10 px-4 py-3 text-white placeholder:text-nightcap-muted focus:border-nightcap-accent focus:outline-none"
            placeholder="Your name"
          />
        </div>
      )}
      <div>
        <label htmlFor="phone" className="block text-sm text-nightcap-muted mb-2">
          Mobile number
        </label>
        <div className="flex gap-2">
          <label htmlFor="country" className="sr-only">
            Country
          </label>
          <select
            id="country"
            value={countryIso}
            onChange={(e) => setCountryIso(e.target.value)}
            className="w-[7.5rem] shrink-0 rounded-xl bg-nightcap/80 border border-white/10 px-2 py-3 text-white focus:border-nightcap-accent focus:outline-none"
          >
            {COUNTRIES.map((item) => (
              <option key={item.iso} value={item.iso}>
                {item.flag} +{item.dial}
              </option>
            ))}
          </select>
          <input
            id="phone"
            type="tel"
            autoComplete="tel-national"
            inputMode="tel"
            value={nationalNumber}
            onChange={(e) => setNationalNumber(e.target.value)}
            required
            className="min-w-0 flex-1 rounded-xl bg-nightcap/80 border border-white/10 px-4 py-3 text-white placeholder:text-nightcap-muted focus:border-nightcap-accent focus:outline-none"
            placeholder={country.placeholder}
          />
        </div>
        <p className="mt-2 text-xs text-nightcap-muted">We’ll text you a one-time code. Standard SMS rates may apply.</p>
      </div>
      {isSignup && (
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
      )}
      {error && <p className="text-red-400 text-sm">{error}</p>}
      {message && <p className="text-nightcap-blue text-sm">{message}</p>}
      {!isSignup && (
        <p className="text-sm text-nightcap-muted">
          By continuing, you agree to the{" "}
          <Link href="/privacy" className="text-nightcap-accent hover:underline">
            Terms of Use, Privacy Policy and Support
          </Link>
          . There is zero tolerance for objectionable content or abusive users.
        </p>
      )}
      <button
        type="submit"
        disabled={loading || (isSignup && !acceptedTerms)}
        className="w-full rounded-xl bg-nightcap-accent px-4 py-3 font-medium text-white transition hover:opacity-90 disabled:opacity-50"
      >
        {loading ? "Sending code..." : "Text me a code"}
      </button>
    </form>
  );
}
