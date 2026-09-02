"use client";

import { useState } from "react";
import { Loader2, Pencil, X } from "lucide-react";
import { updateMeasurementAction } from "@/app/(app)/clienti/actions";
import { Badge } from "@/components/ui/badge";
import { bmi, type Measurement } from "@/lib/types";

const inputClass =
  "min-h-11 rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm outline-none focus:border-accent";

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("ro-RO", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function toNumOrNull(value: string): number | null {
  const n = Number(value);
  return value.trim() !== "" && !Number.isNaN(n) ? n : null;
}

/**
 * Un tile pentru un singur indicator (greutate, IMC, talie...), cu un
 * insignă colorată dedesubt care arată diferența față de evaluarea
 * anterioară — verde pentru creștere, roșu pentru scădere.
 */
function StatTile({
  label,
  unit,
  value,
  previous,
}: {
  label: string;
  unit: string;
  value: number | null;
  previous: number | null;
}) {
  const delta = value !== null && previous !== null ? Math.round((value - previous) * 10) / 10 : null;

  return (
    <div className="flex flex-col gap-1 rounded-lg border border-border-soft bg-surface p-3">
      <p className="text-[11px] text-text-muted">{label}</p>
      <p className="text-sm font-semibold">{value !== null ? `${value}${unit}` : "—"}</p>
      {delta !== null && delta !== 0 ? (
        <span
          className={
            "inline-flex w-fit items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium " +
            (delta > 0 ? "bg-success-soft text-success" : "bg-danger-soft text-danger")
          }
        >
          {delta > 0 ? "+" : ""}
          {delta}
          {unit}
        </span>
      ) : (
        <span className="text-[10px] text-text-faint">&nbsp;</span>
      )}
    </div>
  );
}

export function MeasurementHistory({
  clientId,
  measurements,
}: {
  clientId: string;
  measurements: Measurement[];
}) {
  const [editing, setEditing] = useState<Measurement | null>(null);

  const sorted = [...measurements].sort((a, b) => a.recordedAt.localeCompare(b.recordedAt));
  const withPrevious = sorted.map((measurement, i) => ({
    measurement,
    previous: i > 0 ? sorted[i - 1] : null,
  }));
  const newestFirst = [...withPrevious].reverse();

  if (newestFirst.length === 0) {
    return (
      <p className="mt-6 py-6 text-center text-sm text-text-faint">
        Nicio evaluare înregistrată încă.
      </p>
    );
  }

  return (
    <div className="mt-6 flex flex-col gap-3">
      {newestFirst.map(({ measurement, previous }) => (
        <div key={measurement.id} className="rounded-xl border border-border bg-surface-2 p-4">
          <div className="mb-3 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold">{formatDate(measurement.recordedAt)}</p>
              {measurement.isInitial && <Badge variant="accent">inițial</Badge>}
            </div>
            <button
              onClick={() => setEditing(measurement)}
              aria-label="Editează măsurătoarea"
              className="flex h-9 w-9 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-surface-hover hover:text-text"
            >
              <Pencil className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <StatTile
              label="Greutate"
              unit=" kg"
              value={measurement.weightKg}
              previous={previous?.weightKg ?? null}
            />
            <StatTile
              label="IMC"
              unit=""
              value={Number(bmi(measurement.weightKg, measurement.heightCm).toFixed(1))}
              previous={
                previous ? Number(bmi(previous.weightKg, previous.heightCm).toFixed(1)) : null
              }
            />
            <StatTile label="Piept" unit=" cm" value={measurement.chest} previous={previous?.chest ?? null} />
            <StatTile label="Talie" unit=" cm" value={measurement.waist} previous={previous?.waist ?? null} />
            <StatTile label="Șold" unit=" cm" value={measurement.hips} previous={previous?.hips ?? null} />
            <StatTile label="Braț" unit=" cm" value={measurement.arms} previous={previous?.arms ?? null} />
            <StatTile label="Coapsă" unit=" cm" value={measurement.thigh} previous={previous?.thigh ?? null} />
            <StatTile label="Gambă" unit=" cm" value={measurement.calf} previous={previous?.calf ?? null} />
          </div>

          {measurement.notes && (
            <p className="mt-3 text-xs text-text-muted">{measurement.notes}</p>
          )}
        </div>
      ))}

      {editing && (
        <EditMeasurementModal
          measurement={editing}
          clientId={clientId}
          onDone={() => setEditing(null)}
        />
      )}
    </div>
  );
}

function EditMeasurementModal({
  measurement,
  clientId,
  onDone,
}: {
  measurement: Measurement;
  clientId: string;
  onDone: () => void;
}) {
  const [recordedAt, setRecordedAt] = useState(measurement.recordedAt.slice(0, 10));
  const [weightKg, setWeightKg] = useState(String(measurement.weightKg));
  const [heightCm, setHeightCm] = useState(String(measurement.heightCm));
  const [chest, setChest] = useState(measurement.chest !== null ? String(measurement.chest) : "");
  const [waist, setWaist] = useState(measurement.waist !== null ? String(measurement.waist) : "");
  const [hips, setHips] = useState(measurement.hips !== null ? String(measurement.hips) : "");
  const [arms, setArms] = useState(measurement.arms !== null ? String(measurement.arms) : "");
  const [thigh, setThigh] = useState(measurement.thigh !== null ? String(measurement.thigh) : "");
  const [calf, setCalf] = useState(measurement.calf !== null ? String(measurement.calf) : "");
  const [notes, setNotes] = useState(measurement.notes ?? "");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setPending(true);
    setError(null);
    const result = await updateMeasurementAction(measurement.id, clientId, {
      recordedAt,
      weightKg: Number(weightKg),
      heightCm: Number(heightCm),
      chest: toNumOrNull(chest),
      waist: toNumOrNull(waist),
      hips: toNumOrNull(hips),
      arms: toNumOrNull(arms),
      thigh: toNumOrNull(thigh),
      calf: toNumOrNull(calf),
      notes: notes.trim() || null,
    });
    setPending(false);
    if (result.error) setError(result.error);
    else onDone();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        aria-label="Închide"
        onClick={onDone}
        className="absolute inset-0 h-full w-full bg-black/70"
      />
      <div className="relative flex max-h-[85vh] w-full max-w-lg flex-col gap-4 overflow-y-auto rounded-xl border border-border bg-surface-2 p-5">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">Editează măsurătoarea</h3>
          <button
            onClick={onDone}
            aria-label="Închide"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-text-muted hover:bg-surface-hover"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-text-muted">Data</span>
            <input
              type="date"
              value={recordedAt}
              onChange={(e) => setRecordedAt(e.target.value)}
              max={new Date().toISOString().slice(0, 10)}
              className={inputClass}
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-text-muted">Greutate (kg)</span>
            <input
              type="number"
              step="0.1"
              value={weightKg}
              onChange={(e) => setWeightKg(e.target.value)}
              className={inputClass}
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-text-muted">Înălțime (cm)</span>
            <input
              type="number"
              step="0.1"
              value={heightCm}
              onChange={(e) => setHeightCm(e.target.value)}
              className={inputClass}
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-text-muted">Piept (cm)</span>
            <input
              type="number"
              step="0.1"
              value={chest}
              onChange={(e) => setChest(e.target.value)}
              className={inputClass}
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-text-muted">Talie (cm)</span>
            <input
              type="number"
              step="0.1"
              value={waist}
              onChange={(e) => setWaist(e.target.value)}
              className={inputClass}
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-text-muted">Șold (cm)</span>
            <input
              type="number"
              step="0.1"
              value={hips}
              onChange={(e) => setHips(e.target.value)}
              className={inputClass}
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-text-muted">Braț (cm)</span>
            <input
              type="number"
              step="0.1"
              value={arms}
              onChange={(e) => setArms(e.target.value)}
              className={inputClass}
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-text-muted">Coapsă (cm)</span>
            <input
              type="number"
              step="0.1"
              value={thigh}
              onChange={(e) => setThigh(e.target.value)}
              className={inputClass}
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-text-muted">Gambă (cm)</span>
            <input
              type="number"
              step="0.1"
              value={calf}
              onChange={(e) => setCalf(e.target.value)}
              className={inputClass}
            />
          </label>
        </div>

        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-text-muted">Observații</span>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className={inputClass + " resize-none"}
          />
        </label>

        {error && <p className="text-sm text-accent">{error}</p>}

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onDone}
            className="min-h-11 rounded-lg border border-border px-4 py-2 text-sm text-text-muted transition-colors hover:bg-surface-hover hover:text-text"
          >
            Renunță
          </button>
          <button
            type="button"
            onClick={save}
            disabled={pending}
            className="flex min-h-11 items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-60"
          >
            {pending && <Loader2 className="h-4 w-4 animate-spin" />}
            Salvează
          </button>
        </div>
      </div>
    </div>
  );
}
