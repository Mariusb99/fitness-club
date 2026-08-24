import "server-only";

/**
 * Trimitere de emailuri tranzacționale (notificări către antrenori).
 *
 * Supabase trimite automat emailurile legate de autentificare (invitație,
 * resetare parolă). Pentru restul notificărilor — de exemplu „contul tău a
 * fost dezactivat" — e nevoie de un serviciu separat de email.
 *
 * Implementarea de mai jos folosește Resend dacă sunt setate variabilele
 * de mediu RESEND_API_KEY și EMAIL_FROM. Dacă nu sunt, funcția pur și
 * simplu nu face nimic și raportează `false` — restul platformei
 * funcționează normal, doar că notificarea nu pleacă. Așa poți porni fără
 * niciun cont de email și adăuga serviciul mai târziu, fără modificări de
 * cod.
 */

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const EMAIL_FROM = process.env.EMAIL_FROM;

export function isEmailConfigured(): boolean {
  return Boolean(RESEND_API_KEY && EMAIL_FROM);
}

export async function sendEmail(params: {
  to: string;
  subject: string;
  text: string;
}): Promise<boolean> {
  if (!isEmailConfigured()) return false;

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: EMAIL_FROM,
        to: [params.to],
        subject: params.subject,
        text: params.text,
      }),
    });
    return response.ok;
  } catch {
    // O notificare nelivrată nu trebuie să blocheze acțiunea din platformă
    // (dezactivarea contului s-a făcut deja cu succes în acel moment).
    return false;
  }
}

export const EMAIL_TEMPLATES = {
  accountDeactivated: (fullName: string) => ({
    subject: "Contul tău Fitness Club a fost dezactivat",
    text:
      `Salut, ${fullName}!\n\n` +
      "Contul tău din platforma Fitness Club a fost dezactivat de către administrator. " +
      "Momentan nu te mai poți autentifica, dar datele tale și ale clienților tăi rămân salvate.\n\n" +
      "Dacă ai întrebări, contactează administratorul sălii.",
  }),
  accountReactivated: (fullName: string) => ({
    subject: "Contul tău Fitness Club a fost reactivat",
    text:
      `Salut, ${fullName}!\n\n` +
      "Contul tău din platforma Fitness Club a fost reactivat. Te poți autentifica din nou " +
      "cu aceleași date de conectare ca înainte.\n\n" +
      "Spor la treabă!",
  }),
  passwordReset: (fullName: string, tempPassword: string) => ({
    subject: "Parolă nouă pentru contul Fitness Club",
    text:
      `Salut, ${fullName}!\n\n` +
      "Administratorul ți-a resetat parola. Noua parolă temporară este:\n\n" +
      `    ${tempPassword}\n\n` +
      "Te rugăm să o schimbi după prima autentificare.",
  }),
};
