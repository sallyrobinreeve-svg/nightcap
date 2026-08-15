"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-nightcap flex flex-col items-center justify-center px-6 text-center">
      <h1 className="font-display text-3xl text-white mb-3">Something went wrong</h1>
      <p className="text-nightcap-muted max-w-md mb-6">
        This page hit an unexpected error. You can try again or go back home.
      </p>
      <div className="flex flex-wrap gap-4 justify-center">
        <button
          type="button"
          onClick={() => reset()}
          className="rounded-full bg-nightcap-accent px-6 py-3 font-medium text-white hover:opacity-90"
        >
          Try again
        </button>
        <Link
          href="/feed"
          className="rounded-full glass px-6 py-3 font-medium text-white hover:border-nightcap-accent/50"
        >
          Go to feed
        </Link>
      </div>
    </div>
  );
}
