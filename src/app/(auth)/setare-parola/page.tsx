"use client";

import { useActionState } from "react";
import { Dumbbell, Loader2 } from "lucide-react";
import { setPassword, type SetPasswordState } from "./actions";

const initialState: SetPasswordState = { error: null };
const inputClass =
  "min-h-11 rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm outline-none focus:border-accent";

export default function SetarePasswordPage() {
  const [state, formAction, pending] = useActionState(setPassword, initialState);

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent text-white">
            <Dumbbell className="h-6 w-6" />
          </div>
          <div className="text-center">
            <h1 className="text-lg font-semibold tracking-tight">Setează-ți parola</h1>
            <p className="text-sm text-text-muted">
              Alege o parolă pe care o știi doar tu — o vei folosi la fiecare autentificare.
            </p>
          </div>
        </div>

        <form
          action={formAction}
          className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-6"
        >
          <div className="flex flex-col gap-1.5">
            <label htmlFor="password" className="text-xs font-medium text-text-muted">
              Parolă nouă
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              minLength={8}
              required
              className={inputClass}
              placeholder="minim 8 caractere"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="confirmation" className="text-xs font-medium text-text-muted">
              Confirmă parola
            </label>
            <input
              id="confirmation"
              name="confirmation"
              type="password"
              autoComplete="new-password"
              minLength={8}
              required
              className={inputClass}
              placeholder="••••••••"
            />
          </div>

          {state.error && (
            <p className="rounded-lg border border-accent-soft-border bg-accent-soft px-3 py-2 text-xs text-accent">
              {state.error}
            </p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="mt-1 flex min-h-11 items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-60"
          >
            {pending && <Loader2 className="h-4 w-4 animate-spin" />}
            Salvează parola
          </button>
        </form>
      </div>
    </div>
  );
}
