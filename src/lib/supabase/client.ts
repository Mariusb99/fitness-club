"use client";

import { createBrowserClient } from "@supabase/ssr";
import { SUPABASE_ANON_KEY, SUPABASE_URL, isSupabaseConfigured } from "./env";
import type { Database } from "./database.types";

export function createClient() {
  if (!isSupabaseConfigured()) {
    throw new Error(
      "Supabase nu este configurat. Setează NEXT_PUBLIC_SUPABASE_URL și NEXT_PUBLIC_SUPABASE_ANON_KEY în .env.local.",
    );
  }
  return createBrowserClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY);
}
