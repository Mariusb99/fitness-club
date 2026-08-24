"use client";

import { useActionState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { updateUserAction } from "@/app/(app)/utilizatori/actions";
import type { FormState } from "@/app/(app)/clienti/actions";
import type { Profile } from "@/lib/types";

const initialState: FormState = { error: null };
const inputClass =
  "min-h-11 rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-accent";

/** Editarea datelor unui cont existent, direct din lista de utilizatori. */
export function EditUserForm({
  user,
  isSelf,
  onDone,
  onCancel,
}: {
  user: Profile;
  isSelf: boolean;
  onDone: () => void;
  onCancel: () => void;
}) {
  const [state, formAction, pending] = useActionState(updateUserAction, initialState);

  useEffect(() => {
    if (state.success) onDone();
  }, [state.success, onDone]);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <input type="hidden" name="userId" value={user.id} />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-text-muted">Nume complet *</span>
          <input name="fullName" defaultValue={user.fullName} required className={inputClass} />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-text-muted">Email *</span>
          <input
            name="email"
            type="email"
            defaultValue={user.email}
            required
            className={inputClass}
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-text-muted">Telefon</span>
          <input name="phone" defaultValue={user.phone ?? ""} className={inputClass} />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-text-muted">Rol *</span>
          <select
            name="role"
            defaultValue={user.role}
            disabled={isSelf}
            className={`${inputClass} disabled:opacity-60`}
          >
            <option value="trainer">Antrenor</option>
            <option value="admin">Administrator</option>
          </select>
          {isSelf && (
            <span className="text-xs text-text-faint">
              Nu îți poți schimba singur rolul, ca să nu pierzi accesul.
            </span>
          )}
        </label>
      </div>

      {state.error && <p className="text-xs text-accent">{state.error}</p>}

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={onCancel}
          className="min-h-11 rounded-lg border border-border px-4 py-2 text-sm text-text-muted transition-colors hover:bg-surface-hover hover:text-text"
        >
          Renunță
        </button>
        <button
          type="submit"
          disabled={pending}
          className="flex min-h-11 items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-60"
        >
          {pending && <Loader2 className="h-4 w-4 animate-spin" />}
          Salvează modificările
        </button>
      </div>
    </form>
  );
}
