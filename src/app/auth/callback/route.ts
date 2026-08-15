import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

const APP_SCHEME = "com.mynightcap.app://auth/callback";

function isNightCaptApp(request: NextRequest): boolean {
  const ua = request.headers.get("user-agent") ?? "";
  return ua.includes("NightCaptApp");
}

function isIosBrowser(request: NextRequest): boolean {
  const ua = request.headers.get("user-agent") ?? "";
  return /iPhone|iPad|iPod/i.test(ua);
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code && !isNightCaptApp(request) && isIosBrowser(request)) {
    const qs = searchParams.toString();
    return NextResponse.redirect(`${APP_SCHEME}?${qs}`);
  }

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/auth/signin?error=auth`);
}
