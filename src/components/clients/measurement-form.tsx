"use client";

import { useActionState, useState } from "react";
import { Loader2, Plus, X } from "lucide-react";
import { addMeasurementAction, type FormState } from "@/app/(app)/clienti/actions";

const initialState: FormState = { error: null };
const inputClass =
  "min-h-11 rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm outline-none focus:border-accent";

export function MeasurementForm({
  clientId,
  lastHeightCm,
}: {
  clientId: string;
  lastHeightCm: number;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(addMeasurementAction, initialState);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex min-h-11 items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
      >
        <Plus className="h-4 w-4" />
        Actualizare lunară
      </button>
    );
  }

  return (
    <div className="rounded-2xl border border-accent-soft-border bg-accent-soft/40 p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold">Actualizare lunară</h3>
        <button
          onClick={() => setOpen(false)}
          className="flex h-10 w-10 items-center justify-center rounded-lg text-text-muted hover:bg-surface-hover"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <form action={formAction} className="flex flex-col gap-4">
        <input type="hidden" name="clientId" value={clientId} />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-text-muted">Greutate (kg) *</span>
            <input name="weightKg" type="number" inputMode="decimal" step="0.1" required className={inputClass} />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-text-muted">Înălțime (cm) *</span>
            <input
              name="heightCm"
              type="number"
              inputMode="decimal"
              step="0.1"
              required
              defaultValue={lastHeightCm || undefined}
              className={inputClass}
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-text-muted">Braț (cm)</span>
            <input name="arms" type="number" inputMode="decimal" step="0.1" className={inputClass} />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-text-muted">Piept (cm)</span>
            <input name="chest" type="number" inputMode="decimal" step="0.1" className={inputClass} />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-text-muted">Talie (cm)</span>
            <input name="waist" type="number" inputMode="decimal" step="0.1" className={inputClass} />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-text-muted">Șold (cm)</span>
            <input name="hips" type="number" inputMode="decimal" step="0.1" className={inputClass} />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-text-muted">Coapsă (cm)</span>
            <input name="thigh" type="number" inputMode="decimal" step="0.1" className={inputClass} />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-text-muted">Gambă (cm)</span>
            <input name="calf" type="number" inputMode="decimal" step="0.1" className={inputClass} />
          </label>
        </div>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-text-muted">Observații</span>
          <textarea
            name="notes"
            rows={2}
            className="rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm outline-none focus:border-accent"
          />
        </label>

        {state.error && <p className="text-sm text-accent">{state.error}</p>}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={pending}
            className="flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-60 sm:w-auto"
          >
            {pending && <Loader2 className="h-4 w-4 animate-spin" />}
            Salvează
          </button>
        </div>
      </form>
    </div>
  );
}
