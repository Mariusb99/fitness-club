"use client";

import { useActionState, useState } from "react";
import { Camera, Loader2 } from "lucide-react";
import { updateProfileAction } from "@/app/(app)/profil/actions";
import type { FormState } from "@/app/(app)/clienti/actions";
import { Avatar } from "@/components/ui/avatar";
import type { Profile } from "@/lib/types";

const initialState: FormState = { error: null };
const inputClass =
  "rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm outline-none focus:border-accent";

const SUGGESTED_SPECIALIZATIONS = [
  "Hipertrofie",
  "Slăbire / definiție",
  "Powerlifting",
  "Fitness general",
  "Nutriție",
  "Postură / core",
  "Mobilitate",
  "Reabilitare",
  "Funcțional",
  "Cardio",
  "Forță",
  "Anduranță",
];

export function ProfileForm({ profile }: { profile: Profile }) {
  const [state, formAction, pending] = useActionState(updateProfileAction, initialState);
  const [specializations, setSpecializations] = useState<string[]>(profile.specializations);
  const [newSpec, setNewSpec] = useState("");

  function addSpecialization(value: string) {
    const v = value.trim();
    if (v && !specializations.includes(v)) setSpecializations((s) => [...s, v]);
    setNewSpec("");
  }

  function removeSpecialization(value: string) {
    setSpecializations((s) => s.filter((x) => x !== value));
  }

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <section className="rounded-2xl border border-border bg-surface p-6">
        <h2 className="text-base font-semibold">Identitate</h2>
        <p className="mb-4 text-xs text-text-muted">Cum te prezintă aplicația</p>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <div className="relative">
            <Avatar name={profile.fullName} size="lg" />
            <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-accent text-white">
              <Camera className="h-3 w-3" />
            </span>
          </div>
          <div className="grid flex-1 grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-text-muted">Nume afișat</span>
              <input name="fullName" defaultValue={profile.fullName} required className={inputClass} />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-text-muted">Email</span>
              <input value={profile.email} disabled className={`${inputClass} opacity-60`} />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-text-muted">Data nașterii</span>
              <input
                name="birthDate"
                type="date"
                defaultValue={profile.birthDate ?? ""}
                className={inputClass}
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-text-muted">Telefon</span>
              <input name="phone" defaultValue={profile.phone ?? ""} placeholder="07xx xxx xxx" className={inputClass} />
            </label>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-surface p-6">
        <h2 className="text-base font-semibold">Date profesionale</h2>
        <p className="mb-4 text-xs text-text-muted">Experiență și specializări</p>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-text-muted">Ani experiență</span>
            <input
              name="yearsExperience"
              type="number"
              min={0}
              defaultValue={profile.yearsExperience ?? ""}
              className={`${inputClass} sm:w-40`}
            />
          </label>
          <div>
            <span className="mb-1.5 block text-xs font-medium text-text-muted">
              Specializări (sugestii)
            </span>
            <div className="flex flex-wrap gap-2">
              {SUGGESTED_SPECIALIZATIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => addSpecialization(s)}
                  disabled={specializations.includes(s)}
                  className="rounded-full border border-border px-3 py-1 text-xs text-text-muted transition-colors hover:border-accent-soft-border hover:text-accent disabled:opacity-30"
                >
                  + {s}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-5">
          <span className="mb-1.5 block text-xs font-medium text-text-muted">
            Specializările mele
          </span>
          <div className="mb-2 flex flex-wrap gap-2">
            {specializations.map((s) => (
              <span
                key={s}
                className="flex items-center gap-1.5 rounded-full bg-accent-soft px-3 py-1 text-xs text-accent"
              >
                {s}
                <input type="hidden" name="specializations" value={s} />
                <button
                  type="button"
                  onClick={() => removeSpecialization(s)}
                  className="text-accent/70 hover:text-accent"
                >
                  ×
                </button>
              </span>
            ))}
            {specializations.length === 0 && (
              <span className="text-xs text-text-faint">Nicio specializare adăugată</span>
            )}
          </div>
          <div className="flex gap-2">
            <input
              value={newSpec}
              onChange={(e) => setNewSpec(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addSpecialization(newSpec);
                }
              }}
              placeholder="Adaugă specializare..."
              className={`flex-1 ${inputClass}`}
            />
            <button
              type="button"
              onClick={() => addSpecialization(newSpec)}
              className="rounded-lg border border-border px-4 text-sm text-text-muted hover:bg-surface-hover"
            >
              +
            </button>
          </div>
        </div>

        <label className="mt-5 flex flex-col gap-1.5">
          <span className="text-xs font-medium text-text-muted">Despre mine</span>
          <textarea
            name="bio"
            rows={3}
            defaultValue={profile.bio ?? ""}
            placeholder="Scurtă prezentare profesională..."
            className={inputClass}
          />
        </label>
      </section>

      {state.error && (
        <p className="rounded-lg border border-accent-soft-border bg-accent-soft px-4 py-3 text-sm text-accent">
          {state.error}
        </p>
      )}
      {state.success && (
        <p className="rounded-lg border border-success/30 bg-success-soft px-4 py-3 text-sm text-success">
          Profil salvat cu succes.
        </p>
      )}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={pending}
          className="flex items-center gap-2 rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-60"
        >
          {pending && <Loader2 className="h-4 w-4 animate-spin" />}
          Salvează profilul
        </button>
      </div>
    </form>
  );
}
