import { requireProfile } from "@/lib/auth";
import { listTrainers } from "@/lib/data/trainers";
import { ClientForm } from "@/components/clients/client-form";

export default async function ClientNouPage() {
  const profile = await requireProfile();
  const trainers = profile.role === "admin" ? await listTrainers() : [];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Client nou</h1>
        <p className="text-sm text-text-muted">Creează fișa unui client nou în program.</p>
      </div>
      <ClientForm profile={profile} trainers={trainers} />
    </div>
  );
}
