"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

/**
 * Secțiune de formular care se poate plia. Pe telefon, unde fișa de client
 * are zeci de câmpuri, permite ascunderea părților la care nu lucrezi acum;
 * pe desktop arată practic ca înainte, doar cu o săgeată în antet.
 */
export function CollapsibleSection({
  title,
  description,
  defaultOpen = true,
  children,
}: {
  title: string;
  description?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section className="rounded-2xl border border-border bg-surface">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 px-4 py-4 text-left sm:px-6"
      >
        <span className="min-w-0">
          <span className="block text-base font-semibold">{title}</span>
          {description && (
            <span className="mt-0.5 block text-xs text-text-muted">{description}</span>
          )}
        </span>
        <ChevronDown
          className={`h-5 w-5 shrink-0 text-text-muted transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>
      {/* Conținutul rămâne montat și când e pliat, ca datele deja completate
          să ajungă în formular la trimitere. */}
      <div className={open ? "px-4 pb-5 sm:px-6" : "hidden"}>{children}</div>
    </section>
  );
}
