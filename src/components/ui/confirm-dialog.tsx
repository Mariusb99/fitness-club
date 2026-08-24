"use client";

import { useEffect } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";

/**
 * Dialog de confirmare în stilul platformei, folosit în locul funcției
 * `confirm()` din browser (care arată diferit pe fiecare sistem și nu
 * respectă tema întunecată).
 */
export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Confirmă",
  cancelLabel = "Renunță",
  tone = "danger",
  pending = false,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "danger" | "warning";
  pending?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onCancel]);

  if (!open) return null;

  const confirmClass =
    tone === "danger"
      ? "bg-danger text-white hover:bg-danger/90"
      : "bg-warning text-black hover:bg-warning/90";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center"
    >
      <button
        aria-label={cancelLabel}
        onClick={onCancel}
        className="absolute inset-0 h-full w-full bg-black/70"
      />
      <div className="relative w-full max-w-md rounded-2xl border border-border bg-surface p-5 shadow-xl">
        <div className="flex items-start gap-3">
          <span
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
              tone === "danger" ? "bg-danger-soft text-danger" : "bg-warning-soft text-warning"
            }`}
          >
            <AlertTriangle className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <h3 className="text-base font-semibold">{title}</h3>
            <p className="mt-1 text-sm text-text-muted">{message}</p>
          </div>
        </div>

        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            onClick={onCancel}
            disabled={pending}
            className="min-h-11 rounded-lg border border-border px-4 py-2 text-sm text-text-muted transition-colors hover:bg-surface-hover hover:text-text disabled:opacity-60"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={pending}
            className={`flex min-h-11 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:opacity-60 ${confirmClass}`}
          >
            {pending && <Loader2 className="h-4 w-4 animate-spin" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
