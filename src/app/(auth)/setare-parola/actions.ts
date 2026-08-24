"use server";

import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export interface SetPasswordState {
  error: string | null;
}

/**
 * Setarea parolei de către utilizatorul însuși, după ce a intrat pe linkul
 * de invitație sau de resetare primit pe email. În acel moment are deja o
 * sesiune validă (creată în /auth/confirm), deci nu mai e nevoie de parola
 * veche.
 */
export async function setPassword(
  _prev: SetPasswordState,
  formData: FormData,
): Promise<SetPasswordState> {
  if (!isSupabaseConfigured()) {
    return { error: "Platforma rulează în mod demo — nu există conturi reale de configurat." };
  }

  const password = String(formData.get("password") ?? "");
  const confirmation = String(formData.get("confirmation") ?? "");

  if (password.length < 8) {
    return { error: "Parola trebuie să aibă minim 8 caractere." };
  }
  if (password !== confirmation) {
    return { error: "Cele două parole nu coincid." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return {
      error: "Linkul a expirat. Cere administratorului un link nou de resetare.",
    };
  }

  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    return { error: "Nu am putut salva parola. Încearcă din nou." };
  }

  redirect("/dashboard");
}
