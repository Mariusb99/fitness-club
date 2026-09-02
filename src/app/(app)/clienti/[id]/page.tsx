import { notFound } from "next/navigation";
import { requireProfile } from "@/lib/auth";
import { getClient } from "@/lib/data/clients";
import { listTrainers } from "@/lib/data/trainers";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { age, bmi } from "@/lib/types";
import { MeasurementChart } from "@/components/clients/measurement-chart";
import { MeasurementForm } from "@/components/clients/measurement-form";
import { MeasurementHistory } from "@/components/clients/measurement-history";
import { ExportClientPdfButton } from "@/components/clients/export-pdf-button";
import { StatusSelect, DeleteClientButton } from "@/components/clients/client-actions";
import { ClientPhotos } from "@/components/clients/client-photos";

const STATUS_VARIANT = { activ: "success", suspendat: "warning", inactiv: "neutral" } as const;

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const profile = await requireProfile();
  const [client, trainers] = await Promise.all([getClient(profile, id), listTrainers()]);

  if (!client) notFound();

  const trainerName = trainers.find((t) => t.id === client.trainerId)?.fullName ?? "—";
  const sorted = [...client.measurements].sort((a, b) => a.recordedAt.localeCompare(b.recordedAt));
  const initial = sorted.find((m) => m.isInitial) ?? sorted[0];
  const latest = sorted[sorted.length - 1];
  const clientAge = age(client.birthDate);

  return (
    <div className="flex flex-col gap-6">
      <Card className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Avatar name={client.fullName} size="lg" />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold tracking-tight">{client.fullName}</h1>
              <Badge variant={STATUS_VARIANT[client.status]}>
                {client.status === "activ" ? "Activ" : client.status === "suspendat" ? "Suspendat" : "Inactiv"}
              </Badge>
            </div>
            <p className="text-sm text-text-muted">
              {trainerName} · {clientAge ? `${clientAge} ani` : "vârstă necunoscută"}
              {client.gender ? ` · ${client.gender === "F" ? "Feminin" : "Masculin"}` : ""}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <StatusSelect clientId={client.id} status={client.status} />
          <ExportClientPdfButton client={client} trainerName={trainerName} />
          <DeleteClientButton clientId={client.id} clientName={client.fullName} />
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="p-4">
          <p className="text-xs text-text-muted">Greutate curentă</p>
          <p className="mt-1 text-2xl font-semibold">
            {latest ? `${latest.weightKg} kg` : "—"}
          </p>
          {initial && latest && initial !== latest && (
            <p className="mt-1 text-xs text-success">
              {(initial.weightKg - latest.weightKg).toFixed(1)} kg față de start
            </p>
          )}
        </Card>
        <Card className="p-4">
          <p className="text-xs text-text-muted">IMC actual</p>
          <p className="mt-1 text-2xl font-semibold">
            {latest ? bmi(latest.weightKg, latest.heightCm).toFixed(1) : "—"}
          </p>
          <p className="mt-1 text-xs text-text-muted">{latest ? `${latest.heightCm} cm` : ""}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-text-muted">Evaluări înregistrate</p>
          <p className="mt-1 text-2xl font-semibold">{client.measurements.length}</p>
          <p className="mt-1 text-xs text-text-muted">
            {latest ? `ultima: ${new Date(latest.recordedAt).toLocaleDateString("ro-RO")}` : "—"}
          </p>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="mb-4 text-base font-semibold">Date de contact</h2>
          <dl className="grid grid-cols-1 gap-y-3 text-sm sm:grid-cols-2">
            <dt className="text-text-muted">Email</dt>
            <dd className="break-words">{client.email ?? "—"}</dd>
            <dt className="text-text-muted">Telefon</dt>
            <dd>{client.phone ?? "—"}</dd>
            <dt className="text-text-muted">Data nașterii</dt>
            <dd>{client.birthDate ? new Date(client.birthDate).toLocaleDateString("ro-RO") : "—"}</dd>
            <dt className="text-text-muted">În program din</dt>
            <dd>{new Date(client.createdAt).toLocaleDateString("ro-RO")}</dd>
          </dl>
        </Card>

        <Card>
          <h2 className="mb-4 text-base font-semibold">Obiective și observații</h2>
          <p className="mb-1 text-xs font-medium text-text-muted">Obiective</p>
          <p className="mb-3 text-sm">{client.goals ?? "—"}</p>
          <p className="mb-1 text-xs font-medium text-text-muted">Observații</p>
          <p className="text-sm">{client.notes ?? "—"}</p>
        </Card>
      </div>

      {client.anamnesis && (
        <Card>
          <h2 className="mb-4 text-base font-semibold">Anamneză</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <p className="mb-1 text-xs font-medium text-text-muted">Afecțiuni medicale</p>
              <p className="text-sm">{client.anamnesis.medicalConditions ?? "—"}</p>
            </div>
            <div>
              <p className="mb-1 text-xs font-medium text-text-muted">Medicamente</p>
              <p className="text-sm">{client.anamnesis.medications ?? "—"}</p>
            </div>
            <div>
              <p className="mb-1 text-xs font-medium text-text-muted">Accidentări / leziuni</p>
              <p className="text-sm">{client.anamnesis.injuries ?? "—"}</p>
            </div>
            <div>
              <p className="mb-1 text-xs font-medium text-text-muted">Alergii</p>
              <p className="text-sm">{client.anamnesis.allergies ?? "—"}</p>
            </div>
            <div>
              <p className="mb-1 text-xs font-medium text-text-muted">Contraindicații</p>
              <p className="text-sm">{client.anamnesis.contraindications ?? "—"}</p>
            </div>
          </div>
        </Card>
      )}

      <Card>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold">Evoluție</h2>
            <p className="text-xs text-text-muted">Măsurători lunare și grafic al greutății</p>
          </div>
          <MeasurementForm clientId={client.id} lastHeightCm={latest?.heightCm ?? 0} />
        </div>

        <MeasurementChart measurements={client.measurements} />

        <MeasurementHistory clientId={client.id} measurements={client.measurements} />
      </Card>

      <Card>
        <ClientPhotos clientId={client.id} photos={client.photos} />
      </Card>
    </div>
  );
}
