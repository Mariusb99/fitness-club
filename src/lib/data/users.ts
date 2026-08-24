import "server-only";
import { isSupabaseConfigured, SUPABASE_SERVICE_ROLE_KEY } from "../supabase/env";
import { createClient } from "../supabase/server";
import { createAdminClient } from "../supabase/admin";
import { SEED_CLIENTS, SEED_PROFILES } from "../seed";
import type { Profile } from "../types";
import { mapProfileRow } from "../supabase/mappers";

export interface AdminUserRow {
  profile: Profile;
  /** Câți clienți are asignați (relevant pentru antrenori). */
  clientCount: number;
  /** Ultima autentificare reușită, dacă e disponibilă. */
  lastSignInAt: string | null;
}

/**
 * Lista de utilizatori pentru pagina Utilizatori, îmbogățită cu numărul de
 * clienți asignați și data ultimei autentificări. Ultima autentificare vine
 * din Supabase Auth (auth.users), accesibilă doar cu cheia de service role —
 * fără ea, câmpul rămâne gol, iar restul paginii funcționează normal.
 */
export async function listUsersForAdmin(): Promise<AdminUserRow[]> {
  if (!isSupabaseConfigured()) {
    return SEED_PROFILES.map((profile) => ({
      profile,
      clientCount: SEED_CLIENTS.filter((c) => c.trainerId === profile.id).length,
      lastSignInAt: null,
    }));
  }

  const supabase = await createClient();
  const [{ data: profileRows, error }, { data: clientRows }] = await Promise.all([
    supabase.from("profiles").select("*").order("full_name"),
    supabase.from("clients").select("trainer_id"),
  ]);
  if (error) throw error;

  const clientCountByTrainer = new Map<string, number>();
  for (const row of clientRows ?? []) {
    clientCountByTrainer.set(row.trainer_id, (clientCountByTrainer.get(row.trainer_id) ?? 0) + 1);
  }

  const lastSignInById = await fetchLastSignIns();

  return (profileRows ?? []).map((row) => {
    const profile = mapProfileRow(row);
    return {
      profile,
      clientCount: clientCountByTrainer.get(profile.id) ?? 0,
      lastSignInAt: lastSignInById.get(profile.id) ?? null,
    };
  });
}

async function fetchLastSignIns(): Promise<Map<string, string | null>> {
  const map = new Map<string, string | null>();
  if (!SUPABASE_SERVICE_ROLE_KEY) return map;

  try {
    const adminClient = createAdminClient();
    const { data, error } = await adminClient.auth.admin.listUsers({ page: 1, perPage: 200 });
    if (error || !data) return map;
    for (const user of data.users) {
      map.set(user.id, user.last_sign_in_at ?? null);
    }
  } catch {
    // Lipsa acestui detaliu nu trebuie să pice pagina.
  }
  return map;
}
