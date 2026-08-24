import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "./supabase/env";
import { createClient } from "./supabase/server";
import { SEED_PROFILES } from "./seed";
import type { Profile } from "./types";
import { mapProfileRow } from "./supabase/mappers";

/**
 * Returnează utilizatorul curent (profil + rol). În „mod demo" (Supabase
 * neconfigurat încă) se folosește contul admin din datele demonstrative,
 * ca să poți naviga prin toată platforma înainte de a conecta baza de
 * date reală.
 *
 * Împachetată în `cache()` din React: atât layout-ul din `(app)`, cât și
 * fiecare pagină apelează `requireProfile()`/`requireAdmin()` separat, ca
 * fiecare fișier să rămână independent. Fără `cache()`, asta însemna două
 * interogări complete către Supabase (autentificare + profil) la fiecare
 * navigare — layout-ul le făcea o dată, apoi pagina le repeta identic.
 * `cache()` memorează rezultatul per request: al doilea apel (din pagină)
 * returnează instant rezultatul calculat deja de layout, fără alt drum
 * dus-întors către server. Asta elimină jumătate din latența resimțită la
 * schimbarea paginilor.
 */
export const getCurrentProfile = cache(async (): Promise<Profile | null> => {
  if (!isSupabaseConfigured()) {
    return SEED_PROFILES[0];
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (error || !data) return null;
  const profile = mapProfileRow(data);
  // Un cont dezactivat de administrator nu mai are acces, chiar dacă
  // sesiunea din browser e încă validă.
  if (!profile.isActive) return null;
  return profile;
});

export async function requireProfile(): Promise<Profile> {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  return profile;
}

export async function requireAdmin(): Promise<Profile> {
  const profile = await requireProfile();
  if (profile.role !== "admin") redirect("/dashboard");
  return profile;
}
