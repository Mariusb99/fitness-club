import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { listTrainers, getTrainerDocuments } from "@/lib/data/trainers";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Award } from "lucide-react";

export default async function AntrenoriPage() {
  await requireAdmin();
  const trainers = await listTrainers();

  const withDocs = await Promise.all(
    trainers.map(async (t) => ({ trainer: t, docs: await getTrainerDocuments(t.id) })),
  );

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Antrenori</h1>
        <p className="text-sm text-text-muted">
          Profilurile complete ale antrenorilor — specializări, certificări și diplome descărcabile.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {withDocs.map(({ trainer, docs }) => (
          <Link
            key={trainer.id}
            href={`/antrenori/${trainer.id}`}
            className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-5 transition-colors hover:border-accent-soft-border hover:bg-surface-hover"
          >
            <div className="flex items-center gap-3">
              <Avatar name={trainer.fullName} size="lg" />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{trainer.fullName}</p>
                <p className="truncate text-xs text-text-muted">{trainer.email}</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {trainer.specializations.slice(0, 3).map((s) => (
                <Badge key={s} variant="accent">
                  {s}
                </Badge>
              ))}
              {trainer.specializations.length > 3 && (
                <Badge variant="neutral">+{trainer.specializations.length - 3}</Badge>
              )}
              {trainer.specializations.length === 0 && (
                <span className="text-xs text-text-faint">Fără specializări</span>
              )}
            </div>

            <div className="flex items-center justify-between border-t border-border-soft pt-3 text-xs text-text-muted">
              <span>
                {trainer.yearsExperience ? `${trainer.yearsExperience} ani experiență` : "Fără experiență"}
              </span>
              <span className="flex items-center gap-1">
                <Award className="h-3.5 w-3.5" />
                {docs.length} documente
              </span>
            </div>
          </Link>
        ))}
        {trainers.length === 0 && (
          <p className="col-span-full py-12 text-center text-sm text-text-faint">
            Niciun antrenor adăugat încă. Mergi la Utilizatori pentru a crea un cont.
          </p>
        )}
      </div>
    </div>
  );
}
