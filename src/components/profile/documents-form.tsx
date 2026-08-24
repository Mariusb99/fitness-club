"use client";

import { useActionState } from "react";
import { Award, GraduationCap, Loader2, Upload } from "lucide-react";
import { uploadDocumentAction } from "@/app/(app)/profil/actions";
import type { FormState } from "@/app/(app)/clienti/actions";
import type { Document } from "@/lib/types";

const initialState: FormState = { error: null };
const inputClass =
  "rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm outline-none focus:border-accent";

function UploadBlock({
  kind,
  label,
  icon: Icon,
  documents,
}: {
  kind: "certificare" | "diploma";
  label: string;
  icon: typeof Award;
  documents: Document[];
}) {
  const [state, formAction, pending] = useActionState(uploadDocumentAction, initialState);

  return (
    <section className="rounded-2xl border border-border bg-surface p-6">
      <h2 className="mb-4 flex items-center gap-2 text-base font-semibold">
        <Icon className="h-4 w-4 text-accent" />
        {label}
      </h2>
      <p className="mb-3 text-xs text-text-muted">
        Încarcă poze / documente cu {kind === "certificare" ? "atestate" : "diplome"}
      </p>

      {documents.length === 0 ? (
        <p className="mb-4 text-sm text-text-faint">Nicio {kind === "certificare" ? "certificare" : "diplomă"} încărcată.</p>
      ) : (
        <ul className="mb-4 flex flex-col gap-2">
          {documents.map((d) => (
            <li key={d.id} className="flex items-center justify-between rounded-lg border border-border-soft px-3 py-2 text-sm">
              <span>{d.name}</span>
              <a href={d.fileUrl} target="_blank" rel="noreferrer" className="text-xs text-accent hover:underline">
                Descarcă
              </a>
            </li>
          ))}
        </ul>
      )}

      <form action={formAction} className="flex gap-2">
        <input type="hidden" name="kind" value={kind} />
        <input name="name" placeholder={`Denumire ${kind}...`} className={`flex-1 ${inputClass}`} />
        <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-border px-3 text-xs text-text-muted hover:bg-surface-hover">
          <Upload className="h-3.5 w-3.5" />
          <input name="file" type="file" className="hidden" />
          Fișier
        </label>
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-accent px-3 text-white transition-colors hover:bg-accent-hover disabled:opacity-60"
        >
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
        </button>
      </form>
      {state.error && <p className="mt-2 text-xs text-accent">{state.error}</p>}
    </section>
  );
}

export function DocumentsForm({
  certifications,
  diplomas,
}: {
  certifications: Document[];
  diplomas: Document[];
}) {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <UploadBlock kind="certificare" label="Certificări" icon={Award} documents={certifications} />
      <UploadBlock kind="diploma" label="Diplome" icon={GraduationCap} documents={diplomas} />
    </div>
  );
}
