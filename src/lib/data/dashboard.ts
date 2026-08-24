import "server-only";
import type { Client, Profile } from "../types";

export interface MonthlyWeightPoint {
  label: string;
  avgWeight: number;
}

export interface TrainerSummary {
  id: string;
  fullName: string;
  activeClients: number;
  totalEvaluations: number;
}

export interface EvolutionEntry {
  clientId: string;
  fullName: string;
  trainerName: string;
  kgLost: number;
  percentLost: number;
}

export interface DashboardStats {
  activeClients: number;
  totalClients: number;
  avgKgLost: number;
  monthlyEvaluations: number;
  avgProgressPercent: number;
  weightSeries: MonthlyWeightPoint[];
  byTrainer: TrainerSummary[];
  bestEvolutions: EvolutionEntry[];
  recentClients: Client[];
}

const MONTH_LABELS = [
  "ian", "feb", "mar", "apr", "mai", "iun",
  "iul", "aug", "sep", "oct", "noi", "dec",
];

export function clientDelta(client: Client) {
  const sorted = [...client.measurements].sort((a, b) => a.recordedAt.localeCompare(b.recordedAt));
  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  if (!first || !last || first === last) return null;
  const kgLost = first.weightKg - last.weightKg;
  const percentLost = (kgLost / first.weightKg) * 100;
  return { kgLost, percentLost, first, last };
}

export function computeDashboardStats(
  profile: Profile,
  clients: Client[],
  trainers: { id: string; fullName: string }[],
): DashboardStats {
  const active = clients.filter((c) => c.status === "activ");
  const deltas = clients
    .map((c) => ({ client: c, delta: clientDelta(c) }))
    .filter((d) => d.delta !== null) as { client: Client; delta: NonNullable<ReturnType<typeof clientDelta>> }[];

  const avgKgLost = deltas.length
    ? deltas.reduce((sum, d) => sum + d.delta.kgLost, 0) / deltas.length
    : 0;

  const avgProgressPercent = deltas.length
    ? deltas.reduce((sum, d) => sum + d.delta.percentLost, 0) / deltas.length
    : 0;

  const totalEvaluations = clients.reduce((sum, c) => sum + c.measurements.length, 0);

  // media ponderată pe lună a greutății, ultimele 5 luni disponibile
  const monthBuckets = new Map<string, { sum: number; count: number; date: Date }>();
  for (const c of clients) {
    for (const m of c.measurements) {
      const d = new Date(m.recordedAt);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      const bucket = monthBuckets.get(key) ?? { sum: 0, count: 0, date: d };
      bucket.sum += m.weightKg;
      bucket.count += 1;
      monthBuckets.set(key, bucket);
    }
  }
  const weightSeries = [...monthBuckets.entries()]
    .sort((a, b) => a[1].date.getTime() - b[1].date.getTime())
    .slice(-5)
    .map(([, bucket]) => ({
      label: `${MONTH_LABELS[bucket.date.getMonth()]} '${String(bucket.date.getFullYear()).slice(2)}`,
      avgWeight: Math.round((bucket.sum / bucket.count) * 10) / 10,
    }));

  const byTrainer: TrainerSummary[] = trainers.map((t) => {
    const trainerClients = clients.filter((c) => c.trainerId === t.id);
    return {
      id: t.id,
      fullName: t.fullName,
      activeClients: trainerClients.filter((c) => c.status === "activ").length,
      totalEvaluations: trainerClients.reduce((sum, c) => sum + c.measurements.length, 0),
    };
  });

  const trainerNameById = new Map(trainers.map((t) => [t.id, t.fullName]));
  const bestEvolutions: EvolutionEntry[] = deltas
    .filter((d) => d.delta.kgLost > 0)
    .sort((a, b) => b.delta.kgLost - a.delta.kgLost)
    .slice(0, 5)
    .map((d) => ({
      clientId: d.client.id,
      fullName: d.client.fullName,
      trainerName: trainerNameById.get(d.client.trainerId) ?? "—",
      kgLost: Math.round(d.delta.kgLost * 10) / 10,
      percentLost: Math.round(d.delta.percentLost * 10) / 10,
    }));

  const recentClients = [...clients]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 6);

  return {
    activeClients: active.length,
    totalClients: clients.length,
    avgKgLost: Math.round(avgKgLost * 10) / 10,
    monthlyEvaluations: totalEvaluations,
    avgProgressPercent: Math.round(avgProgressPercent * 10) / 10,
    weightSeries,
    byTrainer,
    bestEvolutions,
    recentClients,
  };
}
