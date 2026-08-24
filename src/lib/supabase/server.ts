import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { SUPABASE_ANON_KEY, SUPABASE_URL, isSupabaseConfigured } from "./env";
import type { Database } from "./database.types";

export async function createClient() {
  if (!isSupabaseConfigured()) {
    throw new Error(
      "Supabase nu este configurat. Setează NEXT_PUBLIC_SUPABASE_URL și NEXT_PUBLIC_SUPABASE_ANON_KEY în .env.local.",
    );
  }
  const cookieStore = await cookies();

  return createServerClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // setAll poate fi apelat dintr-un Server Component — se
          // ignoră dacă middleware-ul reîmprospătează deja sesiunea.
        }
      },
    },
  });
}
