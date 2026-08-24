import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { requireProfile } from "@/lib/auth";
import { listClients } from "@/lib/data/clients";
import { listTrainers } from "@/lib/data/trainers";
import { ClientCard } from "@/components/clients/client-card";

export default async function ClientiPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; antrenor?: string; status?: string }>;
}) {
  const profile = await requireProfile();
  const params = await searchParams;
  const [clients, trainers] = await Promise.all([listClients(profile), listTrainers()]);
  const trainerNameById = new Map(trainers.map((t) => [t.id, t.fullName]));

  const q = (params.q ?? "").trim().toLowerCase();
  const trainerFilter = params.antrenor ?? "";
  const statusFilter = params.status ?? "";

  const filtered = clients.filter((c) => {
    if (q) {
      const haystack = `${c.fullName} ${c.email ?? ""}`.toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    if (trainerFilter && c.trainerId !== trainerFilter) return false;
    if (statusFilter && c.status !== statusFilter) return false;
    return true;
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Clienți</h1>
          <p className="text-sm text-text-muted">
            {profile.role === "admin" ? "Toți clienții din platformă" : "Clienții tăi"}
          </p>
        </div>
        <Link
          href="/clienti/nou"
          className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
        >
          <Plus className="h-4 w-4" />
          Client nou
        </Link>
      </div>

      <form className="flex flex-wrap items-center gap-3" action="/clienti" method="GET">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-faint" />
          <input
            type="text"
            name="q"
            defaultValue={params.q}
            placeholder="Caută după nume sau email..."
            className="w-full rounded-lg border border-border bg-surface py-2.5 pl-9 pr-3 text-sm outline-none focus:border-accent"
          />
        </div>
        {profile.role === "admin" && (
          <select
            name="antrenor"
            defaultValue={trainerFilter}
            className="rounded-lg border border-border bg-surface px-3 py-2.5 text-sm outline-none focus:border-accent"
          >
            <option value="">Toți antrenorii</option>
            {trainers.map((t) => (
              <option key={t.id} value={t.id}>
                {t.fullName}
              </option>
            ))}
          </select>
        )}
        <select
          name="status"
          defaultValue={statusFilter}
          className="rounded-lg border border-border bg-surface px-3 py-2.5 text-sm outline-none focus:border-accent"
        >
          <option value="">Toate statusurile</option>
          <option value="activ">Activ</option>
          <option value="suspendat">Suspendat</option>
          <option value="inactiv">Inactiv</option>
        </select>
        <button
          type="submit"
          className="rounded-lg border border-border px-4 py-2.5 text-sm text-text-muted transition-colors hover:bg-surface-hover hover:text-text"
        >
          Filtrează
        </button>
      </form>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {filtered.map((c) => (
          <ClientCard
            key={c.id}
            client={c}
            trainerName={trainerNameById.get(c.trainerId) ?? "—"}
          />
        ))}
        {filtered.length === 0 && (
          <p className="col-span-full py-12 text-center text-sm text-text-faint">
            Niciun client găsit.
          </p>
        )}
      </div>
    </div>
  );
}
