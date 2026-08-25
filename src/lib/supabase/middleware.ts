import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { SUPABASE_ANON_KEY, SUPABASE_URL, isSupabaseConfigured } from "./env";

// `/auth/confirm` primește linkurile de invitație și resetare parolă, deci
// trebuie accesibilă fără sesiune — acolo se creează sesiunea. `/setare-parola`
// se accesează imediat după, cu sesiunea proaspăt creată.
const PUBLIC_PATHS = ["/login", "/auth/confirm", "/setare-parola"];

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  if (!isSupabaseConfigured()) {
    // Mod demo: fără Supabase configurat, toate rutele sunt accesibile
    // ca administrator, ca să poți vedea platforma înainte de conectare.
    return response;
  }

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  // `getClaims()` verifică JWT-ul local (JWKS al proiectului, cache-uit),
  // fără cerere de rețea către serverul de autentificare la fiecare navigare
  // — spre deosebire de `getUser()`. Aici verificăm doar dacă sesiunea e
  // validă (pentru redirect); citirea reală a profilului, mai jos în
  // aplicație, e oricum re-validată de Supabase prin RLS.
  const { data: claimsData } = await supabase.auth.getClaims();
  const isAuthenticated = Boolean(claimsData?.claims);

  const path = request.nextUrl.pathname;
  const isPublic = PUBLIC_PATHS.some((p) => path.startsWith(p));

  if (!isAuthenticated && !isPublic && path !== "/") {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthenticated && path === "/login") {
    const dashboardUrl = request.nextUrl.clone();
    dashboardUrl.pathname = "/dashboard";
    return NextResponse.redirect(dashboardUrl);
  }

  return response;
}
