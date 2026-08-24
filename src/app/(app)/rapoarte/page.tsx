import Link from "next/link";
import { requireProfile } from "@/lib/auth";
import { listClients } from "@/lib/data/clients";
import { listTrainers } from "@/lib/data/trainers";
import { clientDelta } from "@/lib/data/dashboard";
import { Card } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ExportSummaryPdfButton } from "@/components/reports/export-summary-pdf-button";
import { ExportClientPdfButton } from "@/components/clients/export-pdf-button";

export default async function RapoartePage() {
  const profile = await requireProfile();
  const [clients, trainers] = await Promise.all([listClients(profile), listTrainers()]);
  const trainerNameById = new Map(trainers.map((t) => [t.id, t.fullName]));

  const rows = clients
    .map((client) => {
      const delta = clientDelta(client);
      return {
        client,
        trainerName: trainerNameById.get(client.trainerId) ?? "—",
        kgDelta: delta?.kgLost ?? null,
        percentDelta: delta?.percentLost ?? null,
      };
    })
    .sort((a, b) => (b.kgDelta ?? -Infinity) - (a.kgDelta ?? -Infinity));

  const totalKg = rows.reduce((sum, r) => sum + (r.kgDelta ?? 0), 0);
  const withProgress = rows.filter((r) => r.kgDelta !== null).length;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Rapoarte</h1>
          <p className="text-sm text-text-muted">
            Evoluție lunară, statistici și rapoarte printabile pentru fiecare client.
          </p>
        </div>
        <ExportSummaryPdfButton
          rows={rows}
          title={profile.role === "admin" ? "Toți clienții" : "Clienții tăi"}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="p-4">
          <p className="text-xs text-text-muted">Clienți cu evoluție înregistrată</p>
          <p className="mt-1 text-2xl font-semibold">{withProgress}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-text-muted">Total kg pierduți (cumulat)</p>
          <p className="mt-1 text-2xl font-semibold">
            {totalKg > 0 ? `-${totalKg.toFixed(1)} kg` : "0 kg"}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-text-muted">Medie kg / client</p>
          <p className="mt-1 text-2xl font-semibold">
            {withProgress ? `-${(totalKg / withProgress).toFixed(1)} kg` : "—"}
          </p>
        </Card>
      </div>

      {/* Pe telefon un tabel cu 5 coloane devine ilizibil, așa că aceleași
          date apar sub formă de carduri; tabelul rămâne de la tabletă în sus. */}
      <div className="flex flex-col gap-3 sm:hidden">
        {rows.map((r) => (
          <Card key={r.client.id} className="p-4">
            <div className="flex items-start justify-between gap-3">
              <Link
                href={`/clienti/${r.client.id}`}
                className="flex min-w-0 items-center gap-2.5"
              >
                <Avatar name={r.client.fullName} size="sm" />
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium">{r.client.fullName}</span>
                  <span className="block truncate text-xs text-text-muted">{r.trainerName}</span>
                </span>
              </Link>
              <Badge
                variant={
                  r.client.status === "activ"
                    ? "success"
                    : r.client.status === "suspendat"
                      ? "warning"
                      : "neutral"
                }
              >
                {r.client.status}
              </Badge>
            </div>
            <div className="mt-3 flex items-center justify-between gap-3">
              <span className="text-sm">
                {r.kgDelta !== null ? (
                  <span className={r.kgDelta >= 0 ? "text-success" : "text-danger"}>
                    {r.kgDelta >= 0 ? "-" : "+"}
                    {Math.abs(r.kgDelta).toFixed(1)} kg ({r.percentDelta?.toFixed(1)}%)
                  </span>
                ) : (
                  <span className="text-text-faint">fără evoluție înregistrată</span>
                )}
              </span>
              <ExportClientPdfButton client={r.client} trainerName={r.trainerName} />
            </div>
          </Card>
        ))}
        {rows.length === 0 && (
          <Card className="p-6 text-center text-sm text-text-faint">
            Niciun client de raportat încă.
          </Card>
        )}
      </div>

      <Card className="hidden p-0 sm:block sm:p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-text-muted">
                <th className="px-5 py-3 font-medium">Client</th>
                <th className="px-5 py-3 font-medium">Antrenor</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Progres</th>
                <th className="px-5 py-3 font-medium text-right">Raport</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.client.id} className="border-b border-border-soft last:border-0">
                  <td className="px-5 py-3">
                    <Link href={`/clienti/${r.client.id}`} className="flex items-center gap-2.5 hover:text-accent">
                      <Avatar name={r.client.fullName} size="sm" />
                      <span className="font-medium">{r.client.fullName}</span>
                    </Link>
                  </td>
                  <td className="px-5 py-3 text-text-muted">{r.trainerName}</td>
                  <td className="px-5 py-3">
                    <Badge
                      variant={
                        r.client.status === "activ"
                          ? "success"
                          : r.client.status === "suspendat"
                            ? "warning"
                            : "neutral"
                      }
                    >
                      {r.client.status}
                    </Badge>
                  </td>
                  <td className="px-5 py-3">
                    {r.kgDelta !== null ? (
                      <span className={r.kgDelta >= 0 ? "text-success" : "text-danger"}>
                        {r.kgDelta >= 0 ? "-" : "+"}
                        {Math.abs(r.kgDelta).toFixed(1)} kg ({r.percentDelta?.toFixed(1)}%)
                      </span>
                    ) : (
                      <span className="text-text-faint">—</span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <div className="inline-flex">
                      <ExportClientPdfButton client={r.client} trainerName={r.trainerName} />
                    </div>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-text-faint">
                    Niciun client de raportat încă.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
