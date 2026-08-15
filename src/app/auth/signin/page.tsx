"use client";

import Link from "next/link";
import { PhoneAuthForm } from "@/components/PhoneAuthForm";

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-nightcap flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <Link href="/" className="inline-block font-display text-2xl text-nightcap-accent mb-8">
          NightCapt
        </Link>
        <div className="glass rounded-2xl p-8">
          <h1 className="font-display text-3xl text-white mb-2">Sign in</h1>
          <p className="text-nightcap-muted text-sm mb-6">
            Enter your mobile number and we’ll text you a one-time code. No password needed.
          </p>
          <PhoneAuthForm mode="signin" />
          <p className="mt-6 text-center text-sm text-nightcap-muted">
            Don&apos;t have an account?{" "}
            <Link href="/auth/signup" className="text-nightcap-accent hover:underline">
              Sign up
            </Link>
          </p>
          <p className="mt-4 text-center">
            <Link href="/privacy" className="text-xs text-nightcap-muted hover:text-nightcap-accent transition">
              Terms, Privacy & Support
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
