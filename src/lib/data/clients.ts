import "server-only";
import { isSupabaseConfigured } from "../supabase/env";
import { createClient } from "../supabase/server";
import { SEED_CLIENTS } from "../seed";
import type { Client, Measurement, PhotoAngle, PhotoType, Profile } from "../types";

/** Bucketul privat din Supabase Storage în care stau fotografiile clienților. */
export const PHOTO_BUCKET = "client-photos";

function mapMeasurement(row: {
  id: string;
  client_id: string;
  recorded_at: string;
  is_initial: boolean;
  weight_kg: number;
  height_cm: number;
  arms_cm: number | null;
  chest_cm: number | null;
  waist_cm: number | null;
  hips_cm: number | null;
  thigh_cm: number | null;
  calf_cm: number | null;
  notes: string | null;
}): Measurement {
  return {
    id: row.id,
    clientId: row.client_id,
    recordedAt: row.recorded_at,
    isInitial: row.is_initial,
    weightKg: Number(row.weight_kg),
    heightCm: Number(row.height_cm),
    arms: row.arms_cm !== null ? Number(row.arms_cm) : null,
    chest: row.chest_cm !== null ? Number(row.chest_cm) : null,
    waist: row.waist_cm !== null ? Number(row.waist_cm) : null,
    hips: row.hips_cm !== null ? Number(row.hips_cm) : null,
    thigh: row.thigh_cm !== null ? Number(row.thigh_cm) : null,
    calf: row.calf_cm !== null ? Number(row.calf_cm) : null,
    notes: row.notes,
  };
}

/** Listează clienții vizibili pentru profilul curent (admin = toți, antrenor = doar ai lui). */
export async function listClients(profile: Profile): Promise<Client[]> {
  if (!isSupabaseConfigured()) {
    return profile.role === "admin"
      ? SEED_CLIENTS
      : SEED_CLIENTS.filter((c) => c.trainerId === profile.id);
  }

  const supabase = await createClient();
  let query = supabase
    .from("clients")
    .select("*, measurements(*)")
    .order("created_at", { ascending: false });

  if (profile.role !== "admin") {
    query = query.eq("trainer_id", profile.id);
  }

  const { data, error } = await query;
  if (error) throw error;

  return (data ?? []).map((row) => ({
    id: row.id,
    trainerId: row.trainer_id,
    fullName: row.full_name,
    email: row.email,
    phone: row.phone,
    birthDate: row.birth_date,
    gender: row.gender,
    status: row.status,
    goals: row.goals,
    notes: row.notes,
    createdAt: row.created_at,
    anamnesis: null,
    measurements: ((row as unknown as { measurements: Parameters<typeof mapMeasurement>[0][] }).measurements ?? [])
      .map(mapMeasurement)
      .sort((a, b) => a.recordedAt.localeCompare(b.recordedAt)),
    photos: [],
  }));
}

export async function getClient(profile: Profile, clientId: string): Promise<Client | null> {
  if (!isSupabaseConfigured()) {
    const client = SEED_CLIENTS.find((c) => c.id === clientId);
    if (!client) return null;
    if (profile.role !== "admin" && client.trainerId !== profile.id) return null;
    return client;
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("clients")
    .select("*, measurements(*), client_anamnesis(*), client_photos(*)")
    .eq("id", clientId)
    .single();

  if (error || !data) return null;
  if (profile.role !== "admin" && data.trainer_id !== profile.id) return null;

  const anamnesisRow = (data as unknown as {
    client_anamnesis: {
      medical_conditions: string | null;
      medications: string | null;
      injuries: string | null;
      allergies: string | null;
      contraindications: string | null;
      notes: string | null;
    } | null;
  }).client_anamnesis;

  const photoRows = (data as unknown as {
    client_photos: {
      id: string;
      client_id: string;
      measurement_id: string | null;
      photo_type: PhotoType;
      angle: PhotoAngle | null;
      file_path: string;
      taken_at: string;
    }[];
  }).client_photos;

  // Bucketul `client-photos` este privat, deci fotografiile nu au un URL
  // public. Generăm URL-uri semnate, valabile o oră, doar pentru cine are
  // deja dreptul să vadă clientul.
  const signedUrlByPath = new Map<string, string>();
  const photoPaths = (photoRows ?? []).map((p) => p.file_path);
  if (photoPaths.length > 0) {
    const { data: signed } = await supabase.storage
      .from(PHOTO_BUCKET)
      .createSignedUrls(photoPaths, 60 * 60);
    for (const item of signed ?? []) {
      if (item.path && item.signedUrl) signedUrlByPath.set(item.path, item.signedUrl);
    }
  }

  return {
    id: data.id,
    trainerId: data.trainer_id,
    fullName: data.full_name,
    email: data.email,
    phone: data.phone,
    birthDate: data.birth_date,
    gender: data.gender,
    status: data.status,
    goals: data.goals,
    notes: data.notes,
    createdAt: data.created_at,
    anamnesis: anamnesisRow
      ? {
          medicalConditions: anamnesisRow.medical_conditions,
          medications: anamnesisRow.medications,
          injuries: anamnesisRow.injuries,
          allergies: anamnesisRow.allergies,
          contraindications: anamnesisRow.contraindications,
          notes: anamnesisRow.notes,
        }
      : null,
    measurements: ((data as unknown as { measurements: Parameters<typeof mapMeasurement>[0][] }).measurements ?? [])
      .map(mapMeasurement)
      .sort((a, b) => a.recordedAt.localeCompare(b.recordedAt)),
    photos: (photoRows ?? []).map((p) => ({
      id: p.id,
      clientId: p.client_id,
      measurementId: p.measurement_id,
      photoType: p.photo_type,
      angle: p.angle ?? "fata",
      path: p.file_path,
      url: signedUrlByPath.get(p.file_path) ?? "",
      takenAt: p.taken_at,
    })),
  };
}
