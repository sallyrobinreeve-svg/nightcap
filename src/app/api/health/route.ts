import { NextResponse } from "next/server";
import { isPublicSupabaseConfigured } from "@/lib/env-public";

export const dynamic = "force-dynamic";

/** Lightweight check for monitoring / debugging (no secrets returned). */
export async function GET() {
  const configured = isPublicSupabaseConfigured();
  return NextResponse.json(
    {
      ok: configured,
      supabasePublicEnv: configured ? "set" : "missing",
      timestamp: new Date().toISOString(),
    },
    { status: configured ? 200 : 503 }
  );
}
