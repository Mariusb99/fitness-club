"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { isSupabaseConfigured, SITE_URL, SUPABASE_SERVICE_ROLE_KEY } from "@/lib/supabase/env";
import { createAdminClient } from "@/lib/supabase/admin";
import { recordAuditLog } from "@/lib/data/audit";
import { EMAIL_TEMPLATES, sendEmail } from "@/lib/email";
import type { FormState } from "@/app/(app)/clienti/actions";

const DEMO_ERROR =
  "Platforma rulează în mod demo — conectează proiectul Supabase pentru a putea gestiona conturi reale.";

/** Verificare comună: avem Supabase + cheia de service role pentru Auth Admin API? */
function backendReady(): string | null {
  if (!isSupabaseConfigured()) return DEMO_ERROR;
  if (!SUPABASE_SERVICE_ROLE_KEY) {
    return "Lipsește SUPABASE_SERVICE_ROLE_KEY din variabilele de mediu — necesară pentru gestionarea conturilor.";
  }
  return null;
}

export interface UserActionResult {
  error: string | null;
  /** Mesaj de succes afișat lângă rândul utilizatorului. */
  notice?: string;
  /** Parola temporară generată — se afișează adminului o singură dată. */
  password?: string;
}

// =========================================================
// CREARE CONT
// =========================================================

export async function createUserAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const admin = await requireAdmin();

  const notReady = backendReady();
  if (notReady) return { error: notReady };

  const fullName = String(formData.get("fullName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const role = String(formData.get("role") ?? "trainer") as "admin" | "trainer";
  const phone = String(formData.get("phone") ?? "").trim();
  // „invite" trimite un email prin care utilizatorul își setează singur
  // parola; „password" păstrează varianta veche, cu parolă temporară dată
  // de administrator (utilă dacă emailurile nu sunt încă configurate).
  const method = String(formData.get("method") ?? "invite");
  const password = String(formData.get("password") ?? "");

  if (!fullName || !email) {
    return { error: "Numele complet și emailul sunt obligatorii." };
  }
  if (method === "password" && password.length < 8) {
    return { error: "Parola temporară trebuie să aibă minim 8 caractere." };
  }

  const adminClient = createAdminClient();

  let userId: string;
  if (method === "invite") {
    const { data, error } = await adminClient.auth.admin.inviteUserByEmail(email, {
      redirectTo: `${SITE_URL}/auth/confirm?next=/setare-parola`,
    });
    if (error || !data.user) {
      return { error: `Nu am putut trimite invitația: ${error?.message ?? "eroare necunoscută"}` };
    }
    userId = data.user.id;
  } else {
    const { data, error } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (error || !data.user) {
      return { error: `Nu am putut crea contul: ${error?.message ?? "eroare necunoscută"}` };
    }
    userId = data.user.id;
  }

  const { error: profileError } = await adminClient.from("profiles").insert({
    id: userId,
    role,
    full_name: fullName,
    email,
    phone: phone || null,
  });

  if (profileError) {
    return {
      error: "Contul de autentificare a fost creat, dar profilul a eșuat. Contactează suportul.",
    };
  }

  await recordAuditLog({
    actorId: admin.id,
    action: "creare",
    entityType: "utilizator",
    entityLabel: fullName,
    summary: `Creare cont ${role === "admin" ? "administrator" : "antrenor"}: ${fullName}`,
  });

  revalidatePath("/utilizatori");
  return { error: null, success: true };
}

// =========================================================
// EDITARE CONT
// =========================================================

export async function updateUserAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const admin = await requireAdmin();

  const notReady = backendReady();
  if (notReady) return { error: notReady };

  const userId = String(formData.get("userId") ?? "");
  const fullName = String(formData.get("fullName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const role = String(formData.get("role") ?? "trainer") as "admin" | "trainer";

  if (!userId || !fullName || !email) {
    return { error: "Numele complet și emailul sunt obligatorii." };
  }
  // Dacă adminul curent și-ar schimba singur rolul în „antrenor", ar pierde
  // instant accesul la această pagină și n-ar mai putea reveni.
  if (userId === admin.id && role !== "admin") {
    return { error: "Nu îți poți schimba propriul rol din administrator." };
  }

  const adminClient = createAdminClient();

  // Emailul trăiește în două locuri: în auth.users (folosit la login) și în
  // profiles (afișat în interfață). Le ținem sincronizate.
  const { error: authError } = await adminClient.auth.admin.updateUserById(userId, {
    email,
    email_confirm: true,
  });
  if (authError) {
    return { error: `Nu am putut actualiza emailul de autentificare: ${authError.message}` };
  }

  const { error: profileError } = await adminClient
    .from("profiles")
    .update({ full_name: fullName, email, phone: phone || null, role })
    .eq("id", userId);
  if (profileError) {
    return { error: "Nu am putut salva modificările profilului. Încearcă din nou." };
  }

  await recordAuditLog({
    actorId: admin.id,
    action: "modificare",
    entityType: "utilizator",
    entityLabel: fullName,
    summary: `Modificare cont: ${fullName}`,
  });

  revalidatePath("/utilizatori");
  return { error: null, success: true };
}

// =========================================================
// RESETARE PAROLĂ
// =========================================================

function generatePassword(): string {
  const alphabet = "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = new Uint32Array(12);
  crypto.getRandomValues(bytes);
  const body = Array.from(bytes, (n) => alphabet[n % alphabet.length]).join("");
  // Garantăm cel puțin o cifră și un semn, ca să treacă de regulile
  // uzuale de complexitate.
  return `${body}7!`;
}

/** Setează o parolă temporară nouă și o returnează adminului o singură dată. */
export async function resetUserPasswordAction(
  userId: string,
  fullName: string,
  email: string,
): Promise<UserActionResult> {
  const admin = await requireAdmin();

  const notReady = backendReady();
  if (notReady) return { error: notReady };

  const newPassword = generatePassword();
  const adminClient = createAdminClient();
  const { error } = await adminClient.auth.admin.updateUserById(userId, {
    password: newPassword,
  });
  if (error) return { error: "Nu am putut reseta parola. Încearcă din nou." };

  const template = EMAIL_TEMPLATES.passwordReset(fullName, newPassword);
  const emailSent = await sendEmail({ to: email, ...template });

  await recordAuditLog({
    actorId: admin.id,
    action: "modificare",
    entityType: "utilizator",
    entityLabel: fullName,
    summary: `Resetare parolă: ${fullName}`,
  });

  revalidatePath("/utilizatori");
  return {
    error: null,
    password: newPassword,
    notice: emailSent
      ? "Parola nouă a fost trimisă și pe email."
      : "Transmite-i parola de mai jos — se afișează o singură dată.",
  };
}

/** Trimite utilizatorului un link de resetare pe email (își alege singur parola). */
export async function sendPasswordResetLinkAction(
  userId: string,
  fullName: string,
  email: string,
): Promise<UserActionResult> {
  const admin = await requireAdmin();

  const notReady = backendReady();
  if (notReady) return { error: notReady };

  const adminClient = createAdminClient();
  const { error } = await adminClient.auth.resetPasswordForEmail(email, {
    redirectTo: `${SITE_URL}/auth/confirm?next=/setare-parola`,
  });
  if (error) return { error: `Nu am putut trimite linkul: ${error.message}` };

  await recordAuditLog({
    actorId: admin.id,
    action: "modificare",
    entityType: "utilizator",
    entityLabel: fullName,
    summary: `Trimitere link resetare parolă: ${fullName}`,
  });

  return { error: null, notice: `Link de resetare trimis către ${email}.` };
}

// =========================================================
// ȘTERGERE / DEZACTIVARE
// =========================================================

export async function deleteUserAction(
  userId: string,
  fullName: string,
): Promise<UserActionResult> {
  const admin = await requireAdmin();

  const notReady = backendReady();
  if (notReady) return { error: notReady };
  if (userId === admin.id) return { error: "Nu îți poți șterge propriul cont." };

  const adminClient = createAdminClient();

  // Un antrenor cu clienți asignați nu poate fi șters (ar rămâne clienți
  // orfani) — dezactivează contul în loc, ca să păstrezi istoricul.
  const { count } = await adminClient
    .from("clients")
    .select("id", { count: "exact", head: true })
    .eq("trainer_id", userId);

  if (count && count > 0) {
    return {
      error: `${fullName} are ${count} ${count === 1 ? "client asignat" : "clienți asignați"} — dezactivează contul în loc de a-l șterge, sau reasignează întâi clienții altui antrenor.`,
    };
  }

  const { error: profileError } = await adminClient.from("profiles").delete().eq("id", userId);
  if (profileError) {
    return { error: "Nu am putut șterge profilul. Încearcă din nou." };
  }
  await adminClient.auth.admin.deleteUser(userId);

  await recordAuditLog({
    actorId: admin.id,
    action: "stergere",
    entityType: "utilizator",
    entityLabel: fullName,
    summary: `Ștergere cont: ${fullName}`,
  });

  revalidatePath("/utilizatori");
  return { error: null };
}

export async function setUserActiveAction(
  userId: string,
  fullName: string,
  active: boolean,
  email?: string,
): Promise<UserActionResult> {
  const admin = await requireAdmin();

  const notReady = backendReady();
  if (notReady) return { error: notReady };
  if (userId === admin.id) {
    return { error: "Nu îți poți dezactiva propriul cont." };
  }

  const adminClient = createAdminClient();

  // ban_duration blochează autentificarea fără să șteargă contul sau
  // datele legate de el (clienți, măsurători, istoric).
  const { error: banError } = await adminClient.auth.admin.updateUserById(userId, {
    ban_duration: active ? "none" : "876000h",
  });
  if (banError) return { error: "Nu am putut actualiza contul. Încearcă din nou." };

  const { error: profileError } = await adminClient
    .from("profiles")
    .update({ is_active: active })
    .eq("id", userId);
  if (profileError) return { error: "Nu am putut actualiza profilul. Încearcă din nou." };

  let emailSent = false;
  if (email) {
    const template = active
      ? EMAIL_TEMPLATES.accountReactivated(fullName)
      : EMAIL_TEMPLATES.accountDeactivated(fullName);
    emailSent = await sendEmail({ to: email, ...template });
  }

  await recordAuditLog({
    actorId: admin.id,
    action: "modificare",
    entityType: "utilizator",
    entityLabel: fullName,
    summary: `${active ? "Reactivare" : "Dezactivare"} cont: ${fullName}`,
  });

  revalidatePath("/utilizatori");
  return {
    error: null,
    notice: emailSent ? `${fullName} a fost anunțat pe email.` : undefined,
  };
}
