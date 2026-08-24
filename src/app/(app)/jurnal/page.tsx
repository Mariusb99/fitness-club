import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { listAuditLog } from "@/lib/data/audit";
import { listAllProfiles } from "@/lib/data/trainers";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { History, PlusCircle, Pencil, Trash2, X } from "lucide-react";

const ACTION_META = {
  creare: { label: "Creare", variant: "success", icon: PlusCircle },
  modificare: { label: "Modificare", variant: "warning", icon: Pencil },
  stergere: { label: "Ștergere", variant: "danger", icon: Trash2 },
} as const;

const controlClass =
  "min-h-11 rounded-lg border border-border bg-surface px-3 py-2.5 text-sm outline-none focus:border-accent";

export default async function JurnalPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; action?: string; actor?: string }>;
}) {
  await requireAdmin();
  const params = await searchParams;
  const [entries, profiles] = await Promise.all([listAuditLog(), listAllProfiles()]);

  const q = (params.q ?? "").trim().toLowerCase();
  const actionFilter = params.action ?? "";
  const actorFilter = params.actor ?? "";
  const actorName = profiles.find((p) => p.id === actorFilter)?.fullName;

  const filtered = entries.filter((e) => {
    if (q) {
      const haystack = `${e.entityLabel} ${e.actorName} ${e.summary}`.toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    if (actionFilter && e.action !== actionFilter) return false;
    if (actorFilter && e.actorId !== actorFilter) return false;
    return true;
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-2">
        <History className="h-5 w-5 shrink-0 text-accent" />
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Jurnal de acțiuni</h1>
          <p className="text-sm text-text-muted">
            Trasabilitate completă a modificărilor făcute pe clienți și conturi — adăugări,
            modificări și ștergeri.
          </p>
        </div>
      </div>

      <form className="flex flex-wrap items-center gap-3" action="/jurnal" method="GET">
        <input
          type="text"
          name="q"
          defaultValue={params.q}
          placeholder="Caută după client, autor sau rezumat..."
          className={`min-w-[220px] flex-1 ${controlClass}`}
        />
        <select name="actor" defaultValue={actorFilter} className={controlClass}>
          <option value="">Toți utilizatorii</option>
          {profiles.map((p) => (
            <option key={p.id} value={p.id}>
              {p.fullName}
            </option>
          ))}
        </select>
        <select name="action" defaultValue={actionFilter} className={controlClass}>
          <option value="">Toate acțiunile</option>
          <option value="creare">Creare</option>
          <option value="modificare">Modificare</option>
          <option value="stergere">Ștergere</option>
        </select>
        <button
          type="submit"
          className={`${controlClass} text-text-muted transition-colors hover:bg-surface-hover hover:text-text`}
        >
          Filtrează
        </button>
      </form>

      {actorFilter && (
        <div className="flex flex-wrap items-center gap-2 text-sm text-text-muted">
          <span>
            Se afișează doar acțiunile lui{" "}
            <span className="font-medium text-text">{actorName ?? "utilizator șters"}</span>.
          </span>
          <Link
            href="/jurnal"
            className="inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1 text-xs transition-colors hover:bg-surface-hover hover:text-text"
          >
            <X className="h-3 w-3" />
            Renunță la filtru
          </Link>
        </div>
      )}

      <Card className="p-0 sm:p-0">
        <div className="divide-y divide-border-soft">
          {filtered.map((e) => {
            const meta = ACTION_META[e.action];
            const Icon = meta.icon;
            return (
              <div key={e.id} className="flex items-center gap-3 px-4 py-4 sm:gap-4 sm:px-5">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-danger-soft text-danger">
                  <Icon className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-2 text-sm font-medium">
                    {e.summary}
                    <Badge variant={meta.variant}>{meta.label}</Badge>
                  </p>
                  <p className="text-xs text-text-muted">
                    {e.actorName} ·{" "}
                    {new Date(e.createdAt).toLocaleDateString("ro-RO", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && (
            <p className="px-5 py-10 text-center text-sm text-text-faint">
              {entries.length === 0
                ? "Nicio acțiune înregistrată încă."
                : "Nicio acțiune nu corespunde filtrelor."}
            </p>
          )}
        </div>
      </Card>
    </div>
  );
}
