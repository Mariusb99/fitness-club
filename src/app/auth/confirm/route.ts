import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

/**
 * Punctul de aterizare pentru linkurile trimise pe email de Supabase
 * (invitație cont nou și resetare parolă). Schimbă token-ul din link pe o
 * sesiune validă, apoi trimite utilizatorul mai departe — de regulă către
 * pagina unde își setează parola.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next") ?? "/setare-parola";

  if (!isSupabaseConfigured()) {
    return NextResponse.redirect(`${origin}/login`);
  }

  if (!tokenHash || !type) {
    return NextResponse.redirect(`${origin}/login?eroare=link-invalid`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });

  if (error) {
    return NextResponse.redirect(`${origin}/login?eroare=link-expirat`);
  }

  return NextResponse.redirect(`${origin}${next}`);
}
