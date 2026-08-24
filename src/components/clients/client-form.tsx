"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { createClientAction, type FormState } from "@/app/(app)/clienti/actions";
import { CollapsibleSection } from "@/components/ui/collapsible-section";
import type { Profile } from "@/lib/types";

const initialState: FormState = { error: null };

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-text-muted">{label}</span>
      {children}
    </label>
  );
}

const inputClass =
  "min-h-11 rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm outline-none focus:border-accent";
const textareaClass =
  "rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm outline-none focus:border-accent";

export function ClientForm({ profile, trainers }: { profile: Profile; trainers: Profile[] }) {
  const [state, formAction, pending] = useActionState(createClientAction, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <CollapsibleSection title="Date personale">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Nume complet *">
            <input name="fullName" required className={inputClass} />
          </Field>
          {profile.role === "admin" && (
            <Field label="Antrenor *">
              <select name="trainerId" required className={inputClass} defaultValue="">
                <option value="" disabled>
                  Selectează antrenorul
                </option>
                {trainers
                  .filter((t) => t.isActive)
                  .map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.fullName}
                    </option>
                  ))}
              </select>
            </Field>
          )}
          <Field label="Email">
            <input name="email" type="email" className={inputClass} />
          </Field>
          <Field label="Telefon">
            <input name="phone" type="tel" className={inputClass} />
          </Field>
          <Field label="Data nașterii">
            <input name="birthDate" type="date" className={inputClass} />
          </Field>
          <Field label="Gen">
            <select name="gender" className={inputClass} defaultValue="">
              <option value="">—</option>
              <option value="F">Feminin</option>
              <option value="M">Masculin</option>
            </select>
          </Field>
        </div>
      </CollapsibleSection>

      <CollapsibleSection
        title="Evaluare inițială"
        description="Greutate, înălțime și circumferințe la momentul înscrierii în program."
      >
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Field label="Greutate (kg)">
            <input
              name="weightKg"
              type="number"
              inputMode="decimal"
              step="0.1"
              className={inputClass}
            />
          </Field>
          <Field label="Înălțime (cm)">
            <input
              name="heightCm"
              type="number"
              inputMode="decimal"
              step="0.1"
              className={inputClass}
            />
          </Field>
          <Field label="Braț (cm)">
            <input name="arms" type="number" inputMode="decimal" step="0.1" className={inputClass} />
          </Field>
          <Field label="Piept (cm)">
            <input name="chest" type="number" inputMode="decimal" step="0.1" className={inputClass} />
          </Field>
          <Field label="Talie (cm)">
            <input name="waist" type="number" inputMode="decimal" step="0.1" className={inputClass} />
          </Field>
          <Field label="Șold (cm)">
            <input name="hips" type="number" inputMode="decimal" step="0.1" className={inputClass} />
          </Field>
          <Field label="Coapsă (cm)">
            <input name="thigh" type="number" inputMode="decimal" step="0.1" className={inputClass} />
          </Field>
          <Field label="Gambă (cm)">
            <input name="calf" type="number" inputMode="decimal" step="0.1" className={inputClass} />
          </Field>
        </div>
      </CollapsibleSection>

      <CollapsibleSection
        title="Anamneză"
        description="Informații medicale relevante — vizibile doar antrenorului clientului și administratorului."
        defaultOpen={false}
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Afecțiuni medicale">
            <textarea name="medicalConditions" rows={2} className={textareaClass} />
          </Field>
          <Field label="Medicamente">
            <textarea name="medications" rows={2} className={textareaClass} />
          </Field>
          <Field label="Accidentări / leziuni">
            <textarea name="injuries" rows={2} className={textareaClass} />
          </Field>
          <Field label="Alergii">
            <textarea name="allergies" rows={2} className={textareaClass} />
          </Field>
          <Field label="Contraindicații">
            <textarea name="contraindications" rows={2} className={textareaClass} />
          </Field>
        </div>
      </CollapsibleSection>

      <CollapsibleSection title="Obiective și observații" defaultOpen={false}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Obiective">
            <textarea name="goals" rows={3} className={textareaClass} />
          </Field>
          <Field label="Observații">
            <textarea name="notes" rows={3} className={textareaClass} />
          </Field>
        </div>
      </CollapsibleSection>

      {state.error && (
        <p className="rounded-lg border border-accent-soft-border bg-accent-soft px-4 py-3 text-sm text-accent">
          {state.error}
        </p>
      )}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={pending}
          className="flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-60 sm:w-auto"
        >
          {pending && <Loader2 className="h-4 w-4 animate-spin" />}
          Salvează clientul
        </button>
      </div>
    </form>
  );
}
