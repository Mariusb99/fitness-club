"use client";

import { useActionState, useState } from "react";
import { Loader2, Mail, Plus, X } from "lucide-react";
import { createUserAction } from "@/app/(app)/utilizatori/actions";
import type { FormState } from "@/app/(app)/clienti/actions";

const initialState: FormState = { error: null };
const inputClass =
  "min-h-11 rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm outline-none focus:border-accent";

function randomPassword() {
  return Math.random().toString(36).slice(-6) + Math.random().toString(36).slice(-6).toUpperCase();
}

export function CreateUserForm() {
  const [open, setOpen] = useState(false);
  const [method, setMethod] = useState<"invite" | "password">("invite");
  const [password, setPassword] = useState(randomPassword());
  const [state, formAction, pending] = useActionState(createUserAction, initialState);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex min-h-11 items-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
      >
        <Plus className="h-4 w-4" />
        Cont nou
      </button>
    );
  }

  if (state.success) {
    return (
      <div className="w-full rounded-2xl border border-success/30 bg-success-soft p-5 text-sm text-success">
        {method === "invite"
          ? "Invitație trimisă. Utilizatorul primește un email cu un link prin care își setează singur parola."
          : "Cont creat cu succes. Transmite utilizatorului emailul și parola temporară alese."}
        <div className="mt-3">
          <button
            onClick={() => setOpen(false)}
            className="min-h-10 rounded-lg border border-border px-3 py-1.5 text-xs text-text"
          >
            Închide
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full rounded-2xl border border-accent-soft-border bg-surface p-4 sm:p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-base font-semibold">Cont utilizator nou</h3>
        <button
          onClick={() => setOpen(false)}
          aria-label="Închide"
          className="flex h-10 w-10 items-center justify-center rounded-lg hover:bg-surface-hover"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <form action={formAction} className="flex flex-col gap-4">
        <input type="hidden" name="method" value={method} />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-text-muted">Nume complet *</span>
            <input name="fullName" required className={inputClass} />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-text-muted">Rol *</span>
            <select name="role" defaultValue="trainer" className={inputClass}>
              <option value="trainer">Antrenor</option>
              <option value="admin">Administrator</option>
            </select>
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-text-muted">Email *</span>
            <input name="email" type="email" required className={inputClass} />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-text-muted">Telefon</span>
            <input name="phone" className={inputClass} />
          </label>
        </div>

        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1 text-xs font-medium text-text-muted">Cum primește accesul</legend>
          <MethodOption
            selected={method === "invite"}
            onSelect={() => setMethod("invite")}
            title="Invitație pe email (recomandat)"
            description="Primește un link și își alege singur parola — nu circulă nicio parolă prin mesaje."
          />
          <MethodOption
            selected={method === "password"}
            onSelect={() => setMethod("password")}
            title="Parolă temporară setată de tine"
            description="Utilă dacă emailurile nu sunt încă configurate în Supabase."
          />
        </fieldset>

        {method === "password" && (
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-text-muted">Parolă temporară *</span>
            <div className="flex gap-2">
              <input
                name="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={8}
                required
                className={`flex-1 ${inputClass}`}
              />
              <button
                type="button"
                onClick={() => setPassword(randomPassword())}
                className="min-h-11 rounded-lg border border-border px-3 text-xs text-text-muted hover:bg-surface-hover"
              >
                Generează
              </button>
            </div>
          </label>
        )}

        {state.error && <p className="text-sm text-accent">{state.error}</p>}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={pending}
            className="flex min-h-11 items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-60"
          >
            {pending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : method === "invite" ? (
              <Mail className="h-4 w-4" />
            ) : null}
            {method === "invite" ? "Trimite invitația" : "Creează contul"}
          </button>
        </div>
      </form>
    </div>
  );
}

function MethodOption({
  selected,
  onSelect,
  title,
  description,
}: {
  selected: boolean;
  onSelect: () => void;
  title: string;
  description: string;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={`flex items-start gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors ${
        selected
          ? "border-accent-soft-border bg-accent-soft"
          : "border-border hover:bg-surface-hover"
      }`}
    >
      <span
        className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
          selected ? "border-accent" : "border-border"
        }`}
      >
        {selected && <span className="h-2 w-2 rounded-full bg-accent" />}
      </span>
      <span className="min-w-0">
        <span className={`block text-sm font-medium ${selected ? "text-accent" : "text-text"}`}>
          {title}
        </span>
        <span className="block text-xs text-text-muted">{description}</span>
      </span>
    </button>
  );
}
