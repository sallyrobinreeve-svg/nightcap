import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const DEFAULT_SITE_URL = "https://mynightcap.vercel.app";

/** Public mobile bootstrap config (anon key is already exposed in the web client). */
export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || DEFAULT_SITE_URL;

  if (
    !supabaseUrl?.startsWith("http") ||
    !supabaseAnonKey ||
    supabaseAnonKey.length < 20
  ) {
    return NextResponse.json(
      { error: "Mobile config is not available." },
      { status: 503 }
    );
  }

  return NextResponse.json(
    { supabaseUrl, supabaseAnonKey, siteUrl },
    {
      headers: {
        "Cache-Control": "public, max-age=300",
      },
    }
  );
}
