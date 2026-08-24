"use server";

import { revalidatePath } from "next/cache";
import { requireProfile } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import type { FormState } from "@/app/(app)/clienti/actions";

const DEMO_ERROR =
  "Platforma rulează în mod demo — conectează proiectul Supabase pentru a putea salva modificările.";

export async function updateProfileAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const profile = await requireProfile();
  if (!isSupabaseConfigured()) return { error: DEMO_ERROR };

  const fullName = String(formData.get("fullName") ?? "").trim();
  if (!fullName) return { error: "Numele afișat este obligatoriu." };

  const specializations = formData.getAll("specializations").map(String).filter(Boolean);

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: fullName,
      phone: String(formData.get("phone") ?? "") || null,
      birth_date: String(formData.get("birthDate") ?? "") || null,
      years_experience: numOrNull(formData.get("yearsExperience")),
      specializations,
      bio: String(formData.get("bio") ?? "") || null,
    })
    .eq("id", profile.id);

  if (error) return { error: "Nu am putut salva profilul. Încearcă din nou." };

  revalidatePath("/profil");
  return { error: null, success: true };
}

export async function uploadDocumentAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const profile = await requireProfile();
  if (!isSupabaseConfigured()) return { error: DEMO_ERROR };

  const kind = String(formData.get("kind") ?? "certificare") as "certificare" | "diploma";
  const name = String(formData.get("name") ?? "").trim();
  const file = formData.get("file") as File | null;

  if (!name || !file || file.size === 0) {
    return { error: "Completează denumirea și alege un fișier." };
  }

  const supabase = await createClient();
  const path = `${profile.id}/${Date.now()}-${file.name}`;
  const { error: uploadError } = await supabase.storage
    .from("trainer-documents")
    .upload(path, file);

  if (uploadError) {
    return {
      error:
        "Nu am putut încărca fișierul — verifică dacă bucket-ul „trainer-documents” există în Supabase Storage.",
    };
  }

  const { error: insertError } = await supabase.from("trainer_documents").insert({
    trainer_id: profile.id,
    kind,
    name,
    file_path: path,
  });

  if (insertError) return { error: "Fișierul a fost încărcat, dar salvarea a eșuat." };

  revalidatePath("/profil");
  return { error: null, success: true };
}

function numOrNull(value: FormDataEntryValue | null): number | null {
  const n = Number(value);
  return value && !Number.isNaN(n) ? n : null;
}
