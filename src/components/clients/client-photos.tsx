"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { Camera, Check, ImageIcon, Loader2, Trash2, Upload, X } from "lucide-react";
import {
  deleteClientPhotoAction,
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
  const [preview, setPreview] = useState<ClientPhoto | null>(null);
  const [toDelete, setToDelete] = useState<ClientPhoto | null>(null);
  const [deletePending, startDelete] = useTransition();
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Pentru fiecare unghi păstrăm prima poză „înainte" și ultima „după" —
  // exact perechea care arată evoluția din acel unghi.
  const comparisons = PHOTO_ANGLES.map((angle) => {
    const ofAngle = photos
      .filter((p) => p.angle === angle)
      .sort((a, b) => a.takenAt.localeCompare(b.takenAt));
    const before = ofAngle.find((p) => p.photoType === "before");
    const afterList = ofAngle.filter((p) => p.photoType === "after");
    const after = afterList[afterList.length - 1];
    return { angle, before, after };
  }).filter((c) => c.before && c.after);

  const missingAngles = PHOTO_ANGLES.filter(
    (angle) => !photos.some((p) => p.angle === angle),
  );

  function confirmDelete() {
    if (!toDelete) return;
    setDeleteError(null);
    const photo = toDelete;
    startDelete(async () => {
      const result = await deleteClientPhotoAction(photo.id, clientId, photo.path);
      setDeleteError(result.error);
      if (!result.error) setToDelete(null);
    });
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
          onClick={() => setOpen((v) => !v)}
          className="flex min-h-11 items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm text-text-muted transition-colors hover:bg-surface-hover hover:text-text"
        >
          {open ? <X className="h-4 w-4" /> : <Camera className="h-4 w-4" />}
          {open ? "Renunță" : "Adaugă fotografie"}
        </button>
      </div>

      {open && <PhotoUploadForm clientId={clientId} onDone={() => setOpen(false)} />}

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
        <>
          {comparisons.length > 0 && (
            <div className="rounded-xl border border-accent-soft-border bg-accent-soft/30 p-3 sm:p-4">
              <p className="mb-3 text-xs font-medium text-accent">
                Comparație înainte / după, pe unghiuri
              </p>
              <div className="flex flex-col gap-4">
                {comparisons.map(({ angle, before, after }) => (
                  <div key={angle}>
                    <p className="mb-1.5 text-xs font-medium text-text-muted">
                      {PHOTO_ANGLE_LABELS[angle]}
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      <ComparisonSide
                        label="Înainte"
                        photo={before!}
                        onOpen={() => setPreview(before!)}
                      />
                      <ComparisonSide
                        label="După"
                        photo={after!}
                        onOpen={() => setPreview(after!)}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {PHOTO_ANGLES.map((angle) => {
            const group = photos
              .filter((p) => p.angle === angle)
              .sort((a, b) => a.takenAt.localeCompare(b.takenAt));
            if (group.length === 0) return null;
            return (
              <div key={angle}>
                <p className="mb-2 text-xs font-medium text-text-muted">
                  {PHOTO_ANGLE_LABELS[angle]}{" "}
                  <span className="text-text-faint">
                    · {group.length} {group.length === 1 ? "fotografie" : "fotografii"}
                  </span>
                </p>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {group.map((photo) => (
                    <figure key={photo.id} className="group relative">
                      <button
                        onClick={() => setPreview(photo)}
                        className="block w-full overflow-hidden rounded-xl border border-border"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={photo.url}
                          alt={`${PHOTO_ANGLE_LABELS[angle]} — ${PHOTO_TYPE_LABELS[photo.photoType]}, ${formatDate(photo.takenAt)}`}
                          className="aspect-[3/4] w-full object-cover"
                          loading="lazy"
                        />
                      </button>
                      <span className="absolute left-2 top-2">
                        <Badge variant={TYPE_VARIANT[photo.photoType]}>
                          {PHOTO_TYPE_LABELS[photo.photoType]}
                        </Badge>
                      </span>
                      <button
                        onClick={() => setToDelete(photo)}
                        aria-label="Șterge fotografia"
                        className="absolute right-2 top-2 flex h-9 w-9 items-center justify-center rounded-lg bg-black/70 text-white opacity-0 transition-opacity focus:opacity-100 group-hover:opacity-100"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                      <figcaption className="mt-1 text-center text-xs text-text-faint">
                        {formatDate(photo.takenAt)}
                      </figcaption>
                    </figure>
                  ))}
                </div>
              </div>
            );
          })}
        </>
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

function PhotoUploadForm({ clientId, onDone }: { clientId: string; onDone: () => void }) {
  const [state, formAction, pending] = useActionState(uploadClientPhotoAction, initialState);
  const [fileName, setFileName] = useState<string | null>(null);
  const [angle, setAngle] = useState<PhotoAngle>("fata");
  const [uploadedCount, setUploadedCount] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Reține ultimul rezultat de succes deja procesat, ca să nu reluăm
  // avansarea la unghiul următor dacă acest component se re-randează din
  // alt motiv fără ca `state` să se fi schimbat cu adevărat.
  const lastHandledState = useRef<FormState | null>(null);

  // După o încărcare reușită nu închidem formularul, ci trecem la unghiul
  // următor — ca să poți face rapid setul complet de patru poze, fără să
  // redeschizi formularul de fiecare dată. Efectul reacționează la
  // rezultatul acțiunii de server (un sistem extern), deci e locul potrivit
  // pentru el — dar grupăm toate actualizările într-un singur setState.
  useEffect(() => {
    if (!state.success || lastHandledState.current === state) return;
    lastHandledState.current = state;
    if (fileInputRef.current) fileInputRef.current.value = "";
    setFileName(null);
    setUploadedCount((n) => n + 1);
    setAngle((current) => {
      const next = PHOTO_ANGLES.indexOf(current) + 1;
      return next < PHOTO_ANGLES.length ? PHOTO_ANGLES[next] : current;
    });
  }, [state]);

  /**
   * Un singur input de fișier pentru ambele butoane — altfel formularul ar
   * trimite două câmpuri cu același nume și ar ajunge pe server cel gol.
   * `capture` se pune doar când utilizatorul cere explicit camera.
   */
  function pickFile(useCamera: boolean) {
    const input = fileInputRef.current;
    if (!input) return;
    if (useCamera) input.setAttribute("capture", "environment");
    else input.removeAttribute("capture");
    input.click();
  }

  return (
    <form
      action={formAction}
      className="flex flex-col gap-4 rounded-xl border border-border bg-surface-2 p-4"
    >
      <input type="hidden" name="clientId" value={clientId} />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-text-muted">Unghi *</span>
          <select
            name="angle"
            value={angle}
            onChange={(e) => setAngle(e.target.value as PhotoAngle)}
            className={inputClass}
          >
            {PHOTO_ANGLES.map((a) => (
              <option key={a} value={a}>
                {PHOTO_ANGLE_LABELS[a]}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-text-muted">Moment *</span>
          <select name="photoType" defaultValue="progress" className={inputClass}>
            <option value="before">Înainte</option>
            <option value="progress">Progres</option>
            <option value="after">După</option>
          </select>
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-text-muted">Data fotografiei</span>
          <input
            name="takenAt"
            type="date"
            defaultValue={new Date().toISOString().slice(0, 10)}
            className={inputClass}
          />
        </label>
      </div>

      {/* Pe telefon, `capture` deschide direct camera; pe desktop browserul
          ignoră atributul și afișează selectorul obișnuit de fișiere. */}
      <input
        ref={fileInputRef}
        type="file"
        name="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)}
      />

      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => pickFile(true)}
          className="flex min-h-11 items-center justify-center gap-2 rounded-lg border border-border px-3 py-2 text-sm text-text-muted transition-colors hover:bg-surface-hover hover:text-text"
        >
          <Camera className="h-4 w-4" />
          Fă o poză
        </button>
        <button
          type="button"
          onClick={() => pickFile(false)}
          className="flex min-h-11 items-center justify-center gap-2 rounded-lg border border-border px-3 py-2 text-sm text-text-muted transition-colors hover:bg-surface-hover hover:text-text"
        >
          <Upload className="h-4 w-4" />
          Alege din galerie
        </button>
      </div>

      {fileName && <p className="truncate text-xs text-text-muted">Selectat: {fileName}</p>}
      {state.error && <p className="text-sm text-accent">{state.error}</p>}
      {uploadedCount > 0 && !state.error && (
        <p className="flex items-center gap-1.5 text-xs text-success">
          <Check className="h-3.5 w-3.5" />
          {uploadedCount} {uploadedCount === 1 ? "fotografie încărcată" : "fotografii încărcate"} —
          continuă cu următorul unghi sau apasă „Gata”.
        </p>
      )}

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={onDone}
          className="min-h-11 rounded-lg border border-border px-4 py-2 text-sm text-text-muted transition-colors hover:bg-surface-hover hover:text-text"
        >
          {uploadedCount > 0 ? "Gata" : "Renunță"}
        </button>
        <button
          type="submit"
          disabled={pending || !fileName}
          className="flex min-h-11 items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-60"
        >
          {pending && <Loader2 className="h-4 w-4 animate-spin" />}
          Încarcă fotografia
        </button>
      </div>
    </form>
  );
}
