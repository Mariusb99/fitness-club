import "server-only";
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
 */
export async function getCurrentProfile(): Promise<Profile | null> {
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
}

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
