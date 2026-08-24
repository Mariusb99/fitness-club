import Link from "next/link";
import { Users, TrendingDown, ClipboardList, Activity, Plus, Trophy } from "lucide-react";
import { requireProfile } from "@/lib/auth";
import { listClients } from "@/lib/data/clients";
import { listTrainers } from "@/lib/data/trainers";
import { computeDashboardStats } from "@/lib/data/dashboard";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { StatCard } from "@/components/dashboard/stat-card";
import { WeightChart } from "@/components/dashboard/weight-chart";

export default async function DashboardPage() {
  const profile = await requireProfile();
  const [clients, trainers] = await Promise.all([listClients(profile), listTrainers()]);
  const stats = computeDashboardStats(profile, clients, trainers);
  const firstName = profile.fullName.split(" ")[0];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Salut, {firstName}</h1>
          <p className="text-sm text-text-muted">
            {profile.role === "admin"
              ? "Privire de ansamblu asupra tuturor antrenorilor și clienților"
              : "Privire de ansamblu asupra clienților tăi"}
          </p>
        </div>
        <Link
          href="/clienti"
          className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
        >
          <Plus className="h-4 w-4" />
          Gestionare clienți
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Clienți activi"
          value={String(stats.activeClients)}
          hint={`${stats.totalClients} total`}
          icon={Users}
          accentBar
        />
        <StatCard
          label="Media kg pierduți"
          value={stats.avgKgLost > 0 ? `-${stats.avgKgLost}` : String(stats.avgKgLost)}
          suffix="kg"
          hint="scădere medie"
          icon={TrendingDown}
        />
        <StatCard
          label="Evaluări lunare"
          value={String(stats.monthlyEvaluations)}
          hint="checkin-uri totale"
          icon={ClipboardList}
        />
        <StatCard
          label="Progres mediu greutate"
          value={stats.avgProgressPercent > 0 ? `-${stats.avgProgressPercent}%` : "0%"}
          hint="scădere"
          icon={Activity}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <h2 className="text-base font-semibold">Evoluție greutate medie</h2>
          <p className="mb-2 text-xs text-text-muted">Media ponderată pe lună, toți clienții</p>
          <WeightChart data={stats.weightSeries} />
        </Card>

        {profile.role === "admin" && (
          <Card>
            <h2 className="mb-4 text-base font-semibold">Pe antrenori</h2>
            <div className="flex flex-col gap-3">
              {stats.byTrainer.map((t) => (
                <div
                  key={t.id}
                  className="flex items-center justify-between rounded-xl border border-border bg-surface-2 px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-medium">{t.fullName}</p>
                    <p className="text-xs text-text-muted">
                      {t.activeClients} activi · {t.totalEvaluations} evaluări
                    </p>
                  </div>
                  <span className="text-lg font-semibold text-accent">{t.activeClients}</span>
                </div>
              ))}
              {stats.byTrainer.length === 0 && (
                <p className="text-sm text-text-faint">Niciun antrenor încă.</p>
              )}
            </div>
          </Card>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card>
          <h2 className="mb-4 flex items-center gap-2 text-base font-semibold">
            <Trophy className="h-4 w-4 text-accent" />
            Cea mai bună evoluție
          </h2>
          <div className="flex flex-col gap-2.5">
            {stats.bestEvolutions.map((e, i) => (
              <Link
                key={e.clientId}
                href={`/clienti/${e.clientId}`}
                className="flex items-center gap-3 rounded-xl border border-border-soft px-3 py-2.5 transition-colors hover:border-border hover:bg-surface-2"
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent-soft text-xs font-semibold text-accent">
                  {i + 1}
                </span>
                <Avatar name={e.fullName} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{e.fullName}</p>
                  <p className="truncate text-xs text-text-muted">{e.trainerName}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-success">-{e.kgLost} kg</p>
                  <p className="text-xs text-text-muted">-{e.percentLost}%</p>
                </div>
              </Link>
            ))}
            {stats.bestEvolutions.length === 0 && (
              <p className="text-sm text-text-faint">Fără evoluții înregistrate încă.</p>
            )}
          </div>
        </Card>

        <Card>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold">Clienți recenți</h2>
            <Link href="/clienti" className="text-xs font-medium text-accent hover:underline">
              Toți →
            </Link>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {stats.recentClients.map((c) => (
              <Link
                key={c.id}
                href={`/clienti/${c.id}`}
                className="flex flex-col items-center gap-2 rounded-xl border border-border-soft px-2 py-3 text-center transition-colors hover:border-border hover:bg-surface-2"
              >
                <Avatar name={c.fullName} />
                <p className="w-full truncate text-xs font-medium">{c.fullName}</p>
              </Link>
            ))}
            {stats.recentClients.length === 0 && (
              <p className="col-span-3 text-sm text-text-faint">Niciun client încă.</p>
            )}
          </div>
        </Card>
      </div>

      {profile.role === "trainer" && stats.bestEvolutions.length > 0 && (
        <p className="text-xs text-text-faint">
          <Badge variant="accent">Info</Badge>{" "}
          Clasamentul de evoluție de mai sus este calculat doar din clienții tăi.
        </p>
      )}
    </div>
  );
}
