import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { SUPABASE_SERVICE_ROLE_KEY, SUPABASE_URL } from "./env";
import type { Database } from "./database.types";

/**
 * Client cu drepturi depline (service role) — folosit STRICT în cod de
 * server (route handlers / server actions), niciodată expus către
 * browser. Folosit pentru crearea conturilor de utilizatori de către
 * administrator (Supabase Auth Admin API).
 */
export function createAdminClient() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY nu este setat. Necesar pentru crearea conturilor din pagina Utilizatori.",
    );
  }
  return createSupabaseClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
