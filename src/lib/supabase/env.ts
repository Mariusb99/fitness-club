export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
export const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

/**
 * Adresa publică a platformei — folosită în linkurile trimise pe email
 * (invitație cont nou, resetare parolă), ca utilizatorul să ajungă înapoi
 * în aplicație. În dezvoltare rămâne localhost; în producție se setează
 * cu domeniul real din variabilele de mediu Netlify.
 */
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

/**
 * Platforma poate rula în „mod demo” (date din src/lib/seed.ts) atunci
 * când proiectul Supabase nu a fost încă conectat. Odată setate
 * variabilele de mediu de mai jos într-un fișier .env.local, toate
 * paginile trec automat pe date reale.
 */
export function isSupabaseConfigured(): boolean {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
}
