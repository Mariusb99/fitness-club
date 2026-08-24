import "server-only";
import { isSupabaseConfigured } from "../supabase/env";
import { createClient } from "../supabase/server";
import { SEED_PROFILES } from "../seed";
import type { Document, Profile } from "../types";
import { mapProfileRow } from "../supabase/mappers";

export async function listTrainers(): Promise<Profile[]> {
  if (!isSupabaseConfigured()) {
    return SEED_PROFILES.filter((p) => p.role === "trainer");
  }
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("role", "trainer")
    .order("full_name");
  if (error) throw error;
  return (data ?? []).map(mapProfileRow);
}

export async function listAllProfiles(): Promise<Profile[]> {
  if (!isSupabaseConfigured()) {
    return SEED_PROFILES;
  }
  const supabase = await createClient();
  const { data, error } = await supabase.from("profiles").select("*").order("full_name");
  if (error) throw error;
  return (data ?? []).map(mapProfileRow);
}

export async function getTrainerDocuments(trainerId: string): Promise<Document[]> {
  if (!isSupabaseConfigured()) {
    return [];
  }
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("trainer_documents")
    .select("*")
    .eq("trainer_id", trainerId)
    .order("uploaded_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((d) => ({
    id: d.id,
    trainerId: d.trainer_id,
    kind: d.kind,
    name: d.name,
    fileUrl: d.file_path,
    uploadedAt: d.uploaded_at,
  }));
}
