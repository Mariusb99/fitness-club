"use client";

import { useActionState, useEffect, useState } from "react";
import { Camera, ImageIcon, Loader2, Pencil, Trash2, X } from "lucide-react";
import {
  deleteClientPhotoAction,
  updateClientPhotoAction,
  uploadClientPhotoAction,
  type FormState,
} from "@/app/(app)/clienti/actions";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Badge } from "@/components/ui/badge";
import {
  PHOTO_ANGLES,
  PHOTO_ANGLE_LABELS,
  PHOTO_TYPE_LABELS,
  type ClientPhoto,
  type PhotoAngle,
  type PhotoType,
} from "@/lib/types";

const initialState: FormState = { error: null };

const TYPE_VARIANT = {
  before: "neutral",
  progress: "warning",
  after: "success",
} as const;

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("ro-RO", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function ClientPhotos({
  clientId,
  photos,
}: {
  clientId: string;
  photos: ClientPhoto[];
}) {
  const [open, setOpen] = useState(false);
  const [formKey, setFormKey] = useState(0);
  const [preview, setPreview] = useState<ClientPhoto | null>(null);
  const [toDelete, setToDelete] = useState<ClientPhoto | null>(null);
  const [deletePending, setDeletePending] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [editing, setEditing] = useState<ClientPhoto | null>(null);

  // Doar unghiurile pentru care există măcar o fotografie primesc un tab —
  // altfel am arăta taburi goale, fără nimic de comparat înăuntru.
  const anglesWithPhotos = PHOTO_ANGLES.filter((angle) =>
    photos.some((p) => p.angle === angle),
  );
  const missingAngles = PHOTO_ANGLES.filter((angle) => !photos.some((p) => p.angle === angle));

  // Unghiul ales explicit de utilizator, dacă a apăsat pe un tab. Dacă acel
  // unghi nu mai are fotografii (a fost șters) sau nu a fost ales încă,
  // recădem pe primul unghi disponibil — calculat direct la randare, fără
  // un efect separat care să sincronizeze o a doua bucată de stare.
  const [angleOverride, setAngleOverride] = useState<PhotoAngle | null>(null);
  const activeAngle =
    (angleOverride && anglesWithPhotos.includes(angleOverride)
      ? angleOverride
      : anglesWithPhotos[0]) ?? null;

  // Reține, per unghi, care fotografie e aleasă ca parte „Acum” a
  // comparației — ca la schimbarea taburilor să nu pierdem alegerea făcută
  // anterior pe fiecare unghi.
  const [nowByAngle, setNowByAngle] = useState<Partial<Record<PhotoAngle, string>>>({});

  const anglePhotos = activeAngle
    ? photos.filter((p) => p.angle === activeAngle).sort((a, b) => a.takenAt.localeCompare(b.takenAt))
    : [];
  const before = anglePhotos[0];
  const selectedNowId = activeAngle ? nowByAngle[activeAngle] : undefined;
  const now = anglePhotos.find((p) => p.id === selectedNowId) ?? anglePhotos[anglePhotos.length - 1];

  function confirmDelete() {
    if (!toDelete) return;
    setDeleteError(null);
    const photo = toDelete;
    setDeletePending(true);
    (async () => {
      const result = await deleteClientPhotoAction(photo.id, clientId, photo.path);
      setDeletePending(false);
      setDeleteError(result.error);
      if (!result.error) setToDelete(null);
    })();
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold">Fotografii înainte / după</h2>
          <p className="text-xs text-text-muted">
            Patru unghiuri: față, spate și lateral stânga/dreapta. Fotografiile sunt stocate
            privat — nimeni din afara platformei nu le poate accesa.
          </p>
        </div>
        <button
          onClick={() => {
            if (open) {
              setOpen(false);
            } else {
              setFormKey((k) => k + 1);
              setOpen(true);
            }
          }}
          className="flex min-h-11 items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm text-text-muted transition-colors hover:bg-surface-hover hover:text-text"
        >
          {open ? <X className="h-4 w-4" /> : <Camera className="h-4 w-4" />}
          {open ? "Renunță" : "Evoluție lunară"}
        </button>
      </div>

      {open && (
        <PhotoSetForm
          key={formKey}
          clientId={clientId}
          onDone={() => setOpen(false)}
        />
      )}

      {photos.length > 0 && missingAngles.length > 0 && (
        <p className="text-xs text-text-faint">
          Încă nu ai fotografii din unghiurile:{" "}
          <span className="text-text-muted">
            {missingAngles.map((a) => PHOTO_ANGLE_LABELS[a]).join(", ")}
          </span>
          .
        </p>
      )}

      {photos.length === 0 ? (
        <div className="flex h-40 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border text-text-faint">
          <ImageIcon className="h-6 w-6" />
          <p className="text-sm">Fără fotografii încărcate</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap gap-2 border-b border-border-soft pb-2">
            {anglesWithPhotos.map((angle) => {
              const count = photos.filter((p) => p.angle === angle).length;
              const isActive = angle === activeAngle;
              return (
                <button
                  key={angle}
                  onClick={() => setAngleOverride(angle)}
                  className={
                    "flex min-h-9 items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm transition-colors " +
                    (isActive
                      ? "bg-accent-soft text-accent font-medium"
                      : "text-text-muted hover:bg-surface-hover hover:text-text")
                  }
                >
                  {PHOTO_ANGLE_LABELS[angle]}
                  <span className={isActive ? "text-accent/70" : "text-text-faint"}>{count}</span>
                </button>
              );
            })}
          </div>

          {before && (
            <div className="flex flex-col gap-4 lg:flex-row">
              <div className="flex-1">
                {now && now.id !== before.id ? (
                  <p className="mb-3 text-xs font-medium text-text-muted">
                    Alege un unghi și două momente diferite.
                  </p>
                ) : null}
                <div className="grid grid-cols-2 gap-3">
                  <ComparisonSide
                    label="Înainte"
                    photo={before}
                    onOpen={() => setPreview(before)}
                  />
                  {now && now.id !== before.id ? (
                    <ComparisonSide label="Acum" photo={now} onOpen={() => setPreview(now)} />
                  ) : (
                    <div className="flex aspect-[3/4] w-full items-center justify-center rounded-xl border border-dashed border-border text-center text-xs text-text-faint">
                      Adaugă încă o fotografie din acest unghi ca să vezi o comparație
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-3 overflow-x-auto pb-1 lg:w-44 lg:flex-none lg:flex-col lg:overflow-visible lg:pb-0">
                {[...anglePhotos].reverse().map((photo) => (
                  <figure key={photo.id} className="group relative w-24 flex-none lg:w-full">
                    <button
                      onClick={() =>
                        setNowByAngle((s) => ({ ...s, [activeAngle as PhotoAngle]: photo.id }))
                      }
                      className={
                        "block w-full overflow-hidden rounded-lg border transition-colors " +
                        (now?.id === photo.id
                          ? "border-accent"
                          : "border-border hover:border-text-faint")
                      }
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={photo.url}
                        alt={`${PHOTO_ANGLE_LABELS[photo.angle]} — ${formatDate(photo.takenAt)}`}
                        className="aspect-[3/4] w-full object-cover"
                        loading="lazy"
                      />
                    </button>
                    {/* Butoanele de editare/ștergere sunt mereu vizibile — nu doar la
                        hover, ca să funcționeze și pe telefon/tabletă, unde nu
                        există „hover”. */}
                    <div className="absolute right-1 top-1 flex gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditing(photo);
                        }}
                        aria-label="Editează fotografia"
                        className="flex h-7 w-7 items-center justify-center rounded-md bg-black/70 text-white transition-colors hover:bg-black/90"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setToDelete(photo);
                        }}
                        aria-label="Șterge fotografia"
                        className="flex h-7 w-7 items-center justify-center rounded-md bg-black/70 text-white transition-colors hover:bg-black/90"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <figcaption className="mt-1 flex items-center justify-between gap-1 text-center text-[11px] text-text-faint">
                      <span className="truncate">{formatDate(photo.takenAt)}</span>
                      <Badge variant={TYPE_VARIANT[photo.photoType]}>
                        {PHOTO_TYPE_LABELS[photo.photoType]}
                      </Badge>
                    </figcaption>
                  </figure>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {deleteError && <p className="text-xs text-accent">{deleteError}</p>}

      {preview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            aria-label="Închide"
            onClick={() => setPreview(null)}
            className="absolute inset-0 h-full w-full bg-black/85"
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={preview.url}
            alt={`${PHOTO_ANGLE_LABELS[preview.angle]} — ${PHOTO_TYPE_LABELS[preview.photoType]}`}
            className="relative max-h-[85vh] max-w-full rounded-xl object-contain"
          />
          <button
            onClick={() => setPreview(null)}
            aria-label="Închide"
            className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-lg bg-black/70 text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(toDelete)}
        title="Ștergi fotografia?"
        message="Fotografia se șterge definitiv din platformă și din stocare."
        confirmLabel="Șterge"
        pending={deletePending}
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />

      {editing && (
        <EditPhotoModal
          photo={editing}
          clientId={clientId}
          onDone={() => setEditing(null)}
        />
      )}
    </div>
  );
}

function ComparisonSide({
  label,
  photo,
  onOpen,
}: {
  label: string;
  photo: ClientPhoto;
  onOpen: () => void;
}) {
  return (
    <div>
      <p className="mb-1.5 text-xs text-text-faint">
        {label} · {formatDate(photo.takenAt)}
      </p>
      <button
        onClick={onOpen}
        className="block w-full overflow-hidden rounded-xl border border-border"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={photo.url}
          alt={label}
          className="aspect-[3/4] w-full object-cover"
          loading="lazy"
        />
      </button>
    </div>
  );
}

const inputClass =
  "min-h-11 rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm outline-none focus:border-accent";

function EditPhotoModal({
  photo,
  clientId,
  onDone,
}: {
  photo: ClientPhoto;
  clientId: string;
  onDone: () => void;
}) {
  const [takenAt, setTakenAt] = useState(photo.takenAt.slice(0, 10));
  const [photoType, setPhotoType] = useState<PhotoType>(photo.photoType);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setPending(true);
    setError(null);
    const result = await updateClientPhotoAction(photo.id, clientId, takenAt, photoType);
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
      <div className="relative flex w-full max-w-sm flex-col gap-4 rounded-xl border border-border bg-surface-2 p-5">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">
            Editează — {PHOTO_ANGLE_LABELS[photo.angle]}
          </h3>
          <button
            onClick={onDone}
            aria-label="Închide"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-text-muted hover:bg-surface-hover"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-text-muted">Data</span>
          <input
            type="date"
            value={takenAt}
            onChange={(e) => setTakenAt(e.target.value)}
            max={new Date().toISOString().slice(0, 10)}
            className={inputClass}
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-text-muted">Moment</span>
          <select
            value={photoType}
            onChange={(e) => setPhotoType(e.target.value as PhotoType)}
            className={inputClass}
          >
            <option value="before">Înainte</option>
            <option value="progress">Progres</option>
            <option value="after">După</option>
          </select>
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

function PhotoSetForm({ clientId, onDone }: { clientId: string; onDone: () => void }) {
  const [state, formAction, pending] = useActionState(uploadClientPhotoAction, initialState);
  const [slots, setSlots] = useState<Partial<Record<PhotoAngle, { url: string; name: string }>>>(
    {},
  );

  useEffect(() => {
    if (state.success) onDone();
  }, [state.success, onDone]);

  function pickFile(angle: PhotoAngle, file: File | null | undefined) {
    setSlots((current) => {
      const previous = current[angle];
      if (previous) URL.revokeObjectURL(previous.url);
      if (!file) {
        const next = { ...current };
        delete next[angle];
        return next;
      }
      return { ...current, [angle]: { url: URL.createObjectURL(file), name: file.name } };
    });
  }

  const hasAnyPhoto = Object.keys(slots).length > 0;

  return (
    <form
      action={formAction}
      className="flex flex-col gap-4 rounded-xl border border-border bg-surface-2 p-4"
    >
      <input type="hidden" name="clientId" value={clientId} />

      <div>
        <h3 className="text-sm font-semibold">Evoluție lunară</h3>
        <p className="mt-0.5 text-xs text-text-muted">
          Adaugă un set de fotografii realizate în aceeași zi.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-text-muted">Data fotografiilor</span>
          <input
            name="takenAt"
            type="date"
            defaultValue={new Date().toISOString().slice(0, 10)}
            max={new Date().toISOString().slice(0, 10)}
            className={inputClass}
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-text-muted">Moment</span>
          <select name="photoType" defaultValue="progress" className={inputClass}>
            <option value="before">Înainte</option>
            <option value="progress">Progres</option>
            <option value="after">După</option>
          </select>
        </label>
      </div>

      <div>
        <p className="mb-2 text-xs font-medium text-text-muted">Fotografii</p>
        <p className="mb-3 text-xs text-text-faint">
          Poți adăuga una sau toate pozițiile. Apasă din nou pentru a înlocui poza.
        </p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {PHOTO_ANGLES.map((angle) => {
            const slot = slots[angle];
            return (
              <label
                key={angle}
                className="relative flex aspect-[3/4] cursor-pointer flex-col items-center justify-center gap-2 overflow-hidden rounded-xl border border-dashed border-border bg-surface text-center transition-colors hover:border-accent"
              >
                <input
                  type="file"
                  name={`file_${angle}`}
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => pickFile(angle, e.target.files?.[0])}
                />
                {slot ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={slot.url}
                      alt={PHOTO_ANGLE_LABELS[angle]}
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                    <span className="absolute inset-x-0 bottom-0 bg-black/70 px-1.5 py-1 text-[11px] text-white">
                      {PHOTO_ANGLE_LABELS[angle]}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        pickFile(angle, null);
                      }}
                      aria-label={`Elimină poza — ${PHOTO_ANGLE_LABELS[angle]}`}
                      className="absolute right-1 top-1 flex h-7 w-7 items-center justify-center rounded-md bg-black/70 text-white"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </>
                ) : (
                  <>
                    <ImageIcon className="h-6 w-6 text-text-faint" />
                    <span className="text-xs text-text-muted">Adaugă</span>
                    <span className="text-[11px] text-text-faint">{PHOTO_ANGLE_LABELS[angle]}</span>
                  </>
                )}
              </label>
            );
          })}
        </div>
      </div>

      {state.error && <p className="text-sm text-accent">{state.error}</p>}

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={onDone}
          className="min-h-11 rounded-lg border border-border px-4 py-2 text-sm text-text-muted transition-colors hover:bg-surface-hover hover:text-text"
        >
          Renunță
        </button>
        <button
          type="submit"
          disabled={pending || !hasAnyPhoto}
          className="flex min-h-11 items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-60"
        >
          {pending && <Loader2 className="h-4 w-4 animate-spin" />}
          Încarcă evoluția lunară
        </button>
      </div>
    </form>
  );
}
