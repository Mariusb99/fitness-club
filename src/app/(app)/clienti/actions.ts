"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireProfile } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import { recordAuditLog } from "@/lib/data/audit";
import { PHOTO_BUCKET, type PhotoAngle, type PhotoType } from "@/lib/types";

export interface FormState {
  error: string | null;
  success?: boolean;
}

const DEMO_ERROR =
  "Platforma rulează în mod demo — conectează proiectul Supabase pentru a putea salva date reale.";

export async function createClientAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const profile = await requireProfile();
  if (!isSupabaseConfigured()) return { error: DEMO_ERROR };

  const fullName = String(formData.get("fullName") ?? "").trim();
  if (!fullName) return { error: "Numele complet este obligatoriu." };

  const trainerId =
    profile.role === "admin" ? String(formData.get("trainerId") ?? "") : profile.id;
  if (!trainerId) return { error: "Selectează antrenorul." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("clients")
    .insert({
      trainer_id: trainerId,
      full_name: fullName,
      email: String(formData.get("email") ?? "") || null,
      phone: String(formData.get("phone") ?? "") || null,
      birth_date: String(formData.get("birthDate") ?? "") || null,
      gender: (String(formData.get("gender") ?? "") || null) as "M" | "F" | null,
      goals: String(formData.get("goals") ?? "") || null,
      notes: String(formData.get("notes") ?? "") || null,
      created_by: profile.id,
    })
    .select("id")
    .single();

  if (error || !data) return { error: "Nu am putut salva clientul. Încearcă din nou." };

  const weightKg = Number(formData.get("weightKg"));
  const heightCm = Number(formData.get("heightCm"));
  if (weightKg && heightCm) {
    await supabase.from("measurements").insert({
      client_id: data.id,
      is_initial: true,
      weight_kg: weightKg,
      height_cm: heightCm,
      arms_cm: numOrNull(formData.get("arms")),
      chest_cm: numOrNull(formData.get("chest")),
      waist_cm: numOrNull(formData.get("waist")),
      hips_cm: numOrNull(formData.get("hips")),
      thigh_cm: numOrNull(formData.get("thigh")),
      calf_cm: numOrNull(formData.get("calf")),
      created_by: profile.id,
    });
  }

  const medical = String(formData.get("medicalConditions") ?? "");
  const meds = String(formData.get("medications") ?? "");
  const injuries = String(formData.get("injuries") ?? "");
  const allergies = String(formData.get("allergies") ?? "");
  const contra = String(formData.get("contraindications") ?? "");
  if (medical || meds || injuries || allergies || contra) {
    await supabase.from("client_anamnesis").insert({
      client_id: data.id,
      medical_conditions: medical || null,
      medications: meds || null,
      injuries: injuries || null,
      allergies: allergies || null,
      contraindications: contra || null,
    });
  }

  await recordAuditLog({
    actorId: profile.id,
    action: "creare",
    entityType: "client",
    entityLabel: fullName,
    summary: `Creare client: ${fullName}`,
  });

  revalidatePath("/clienti");
  redirect(`/clienti/${data.id}`);
}

export async function addMeasurementAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const profile = await requireProfile();
  if (!isSupabaseConfigured()) return { error: DEMO_ERROR };

  const clientId = String(formData.get("clientId") ?? "");
  const weightKg = Number(formData.get("weightKg"));
  const heightCm = Number(formData.get("heightCm"));
  const recordedAt = String(formData.get("recordedAt") ?? "");
  if (!clientId || !weightKg || !heightCm) {
    return { error: "Completează cel puțin greutatea și înălțimea." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("measurements").insert({
    client_id: clientId,
    is_initial: false,
    recorded_at: recordedAt || new Date().toISOString().slice(0, 10),
    weight_kg: weightKg,
    height_cm: heightCm,
    arms_cm: numOrNull(formData.get("arms")),
    chest_cm: numOrNull(formData.get("chest")),
    waist_cm: numOrNull(formData.get("waist")),
    hips_cm: numOrNull(formData.get("hips")),
    thigh_cm: numOrNull(formData.get("thigh")),
    calf_cm: numOrNull(formData.get("calf")),
    notes: String(formData.get("notes") ?? "") || null,
    created_by: profile.id,
  });

  if (error) return { error: "Nu am putut salva actualizarea." };

  await recordAuditLog({
    actorId: profile.id,
    action: "modificare",
    entityType: "masuratoare",
    entityLabel: clientId,
    summary: "Actualizare lunară adăugată",
  });

  revalidatePath(`/clienti/${clientId}`);
  return { error: null, success: true };
}

export async function deleteClientAction(clientId: string, clientName: string) {
  const profile = await requireProfile();
  if (!isSupabaseConfigured()) return;

  const supabase = await createClient();
  await supabase.from("clients").delete().eq("id", clientId);

  await recordAuditLog({
    actorId: profile.id,
    action: "stergere",
    entityType: "client",
    entityLabel: clientName,
    summary: `Ștergere client: ${clientName}`,
  });

  revalidatePath("/clienti");
  redirect("/clienti");
}

export async function updateClientStatusAction(
  clientId: string,
  status: "activ" | "suspendat" | "inactiv",
) {
  const profile = await requireProfile();
  if (!isSupabaseConfigured()) return;

  const supabase = await createClient();
  await supabase.from("clients").update({ status }).eq("id", clientId);

  await recordAuditLog({
    actorId: profile.id,
    action: "modificare",
    entityType: "client",
    entityLabel: clientId,
    summary: `Status actualizat: ${status}`,
  });

  revalidatePath(`/clienti/${clientId}`);
  revalidatePath("/clienti");
}

// =========================================================
// FOTOGRAFII CLIENT
// =========================================================

/**
 * Salvează un set întreg de „evoluție lunară": una sau mai multe poze
 * (câte una per unghi), toate cu aceeași dată și același moment.
 *
 * Fotografiile în sine NU trec prin această acțiune — se încarcă direct
 * din browser în Supabase Storage (vezi `client-photos.tsx`), pentru că o
 * funcție server pe Vercel refuză orice cerere peste 4.5 MB, indiferent
 * ce limită setăm noi în `next.config.ts`. Aici primim doar căile
 * fișierelor deja urcate și le legăm de client în baza de date — o
 * cerere mică, mult sub orice limită.
 */
export async function saveClientPhotoSetAction(
  clientId: string,
  takenAt: string,
  photoType: PhotoType,
  entries: { angle: PhotoAngle; path: string }[],
): Promise<FormState> {
  const profile = await requireProfile();
  if (!isSupabaseConfigured()) return { error: DEMO_ERROR };

  if (!clientId) return { error: "Client lipsă." };
  if (entries.length === 0) return { error: "Adaugă cel puțin o fotografie." };
  const resolvedTakenAt = takenAt || new Date().toISOString().slice(0, 10);

  const supabase = await createClient();

  // Verificăm explicit că antrenorul are dreptul la acest client, ca să nu
  // se poată lega fotografii de dosarul altui antrenor.
  const { data: client, error: clientError } = await supabase
    .from("clients")
    .select("id, trainer_id")
    .eq("id", clientId)
    .single();
  if (clientError || !client) return { error: "Clientul nu a fost găsit." };
  if (profile.role !== "admin" && client.trainer_id !== profile.id) {
    return { error: "Nu ai acces la acest client." };
  }

  const { error: insertError } = await supabase.from("client_photos").insert(
    entries.map((entry) => ({
      client_id: clientId,
      photo_type: photoType,
      angle: entry.angle,
      file_path: entry.path,
      taken_at: resolvedTakenAt,
    })),
  );
  if (insertError) {
    // Fișierele au ajuns deja în Storage dar nu s-au putut lega de client —
    // le ștergem, ca să nu rămână orfane și să ocupe spațiu degeaba.
    await supabase.storage.from(PHOTO_BUCKET).remove(entries.map((e) => e.path));
    return { error: "Nu am putut salva fotografiile. Încearcă din nou." };
  }

  await recordAuditLog({
    actorId: profile.id,
    action: "creare",
    entityType: "client",
    entityLabel: clientId,
    summary: `Evoluție lunară adăugată (${entries.length} ${entries.length === 1 ? "fotografie" : "fotografii"})`,
  });

  revalidatePath(`/clienti/${clientId}`);
  return { error: null, success: true };
}

export async function updateClientPhotoAction(
  photoId: string,
  clientId: string,
  takenAt: string,
  photoType: PhotoType,
): Promise<FormState> {
  const profile = await requireProfile();
  if (!isSupabaseConfigured()) return { error: DEMO_ERROR };
  if (!takenAt) return { error: "Alege o dată." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("client_photos")
    .update({ taken_at: takenAt, photo_type: photoType })
    .eq("id", photoId);
  if (error) return { error: "Nu am putut actualiza fotografia." };

  await recordAuditLog({
    actorId: profile.id,
    action: "modificare",
    entityType: "client",
    entityLabel: clientId,
    summary: "Fotografie actualizată",
  });

  revalidatePath(`/clienti/${clientId}`);
  return { error: null, success: true };
}

export async function deleteClientPhotoAction(
  photoId: string,
  clientId: string,
  path: string,
): Promise<FormState> {
  const profile = await requireProfile();
  if (!isSupabaseConfigured()) return { error: DEMO_ERROR };

  const supabase = await createClient();

  const { error } = await supabase.from("client_photos").delete().eq("id", photoId);
  if (error) return { error: "Nu am putut șterge fotografia." };

  await supabase.storage.from(PHOTO_BUCKET).remove([path]);

  await recordAuditLog({
    actorId: profile.id,
    action: "stergere",
    entityType: "client",
    entityLabel: clientId,
    summary: "Fotografie ștearsă",
  });

  revalidatePath(`/clienti/${clientId}`);
  return { error: null, success: true };
}

function numOrNull(value: FormDataEntryValue | null): number | null {
  const n = Number(value);
  return value && !Number.isNaN(n) ? n : null;
}
