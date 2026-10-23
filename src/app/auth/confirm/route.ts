import { type EmailOtpType } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";

import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";

function buildRedirectURL(request: NextRequest, path: string) {
  return new URL(path, request.url);
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const next = requestUrl.searchParams.get("next") ?? "/dashboard";
  const tokenHash = requestUrl.searchParams.get("token_hash");
  const type = requestUrl.searchParams.get("type") as EmailOtpType | null;

  if (!tokenHash || !type) {
    return NextResponse.redirect(
      buildRedirectURL(request, "/sign-in?error=Missing+confirmation+token."),
    );
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.verifyOtp({
    token_hash: tokenHash,
    type,
  });

  if (error) {
    return NextResponse.redirect(
      buildRedirectURL(request, `/sign-in?error=${encodeURIComponent(error.message)}`),
    );
  }

  const safeNext = next.startsWith("/") ? next : "/dashboard";

  return NextResponse.redirect(buildRedirectURL(request, `${safeNext}?status=confirmed`));
}
