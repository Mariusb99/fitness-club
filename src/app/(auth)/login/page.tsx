"use client";

import { useActionState } from "react";
import { Dumbbell, Loader2 } from "lucide-react";
import { login, type LoginState } from "./actions";

const initialState: LoginState = { error: null };

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(login, initialState);

  return (
    <div className="flex flex-1 items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent text-white">
            <Dumbbell className="h-6 w-6" />
          </div>
          <div className="text-center">
            <h1 className="text-lg font-semibold tracking-tight">Fitness Club</h1>
            <p className="text-sm text-text-muted">Platformă internă antrenori</p>
          </div>
        </div>

        <form
          action={formAction}
          className="rounded-2xl border border-border bg-surface p-6 flex flex-col gap-4"
        >
          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="text-xs font-medium text-text-muted">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm outline-none focus:border-accent"
              placeholder="nume@exemplu.com"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="password" className="text-xs font-medium text-text-muted">
              Parolă
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm outline-none focus:border-accent"
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
            className="mt-1 flex items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-60"
          >
            {pending && <Loader2 className="h-4 w-4 animate-spin" />}
            Autentificare
          </button>

          <p className="text-center text-xs text-text-faint">
            Conturile se creează exclusiv de către administrator.
          </p>
        </form>
      </div>
    </div>
  );
}
