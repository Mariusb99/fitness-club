import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Award, GraduationCap, Mail, Phone, Cake, Briefcase } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { listAllProfiles, getTrainerDocuments } from "@/lib/data/trainers";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { age } from "@/lib/types";

export default async function AntrenorDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requireAdmin();
  const [profiles, docs] = await Promise.all([listAllProfiles(), getTrainerDocuments(id)]);
  const trainer = profiles.find((p) => p.id === id && p.role === "trainer");
  if (!trainer) notFound();

  const certifications = docs.filter((d) => d.kind === "certificare");
  const diplomas = docs.filter((d) => d.kind === "diploma");
  const trainerAge = age(trainer.birthDate);

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/antrenori"
        className="flex w-fit items-center gap-2 text-sm text-text-muted transition-colors hover:text-text"
      >
        <ArrowLeft className="h-4 w-4" />
        Înapoi la Antrenori
      </Link>

      <Card>
        <div className="flex flex-wrap items-start gap-4">
          <Avatar name={trainer.fullName} size="lg" />
          <div className="flex-1">
            <h1 className="text-xl font-semibold tracking-tight">{trainer.fullName}</h1>
            <p className="text-sm text-text-muted">{trainer.email}</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {trainer.specializations.map((s) => (
                <Badge key={s} variant="accent">
                  {s}
                </Badge>
              ))}
              {trainer.specializations.length === 0 && (
                <span className="text-xs text-text-faint">Fără specializări adăugate</span>
              )}
            </div>
          </div>
        </div>

        {trainer.bio && <p className="mt-4 text-sm text-text-muted">{trainer.bio}</p>}

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-border bg-surface-2 p-4">
            <p className="mb-1 flex items-center gap-1.5 text-xs text-text-muted">
              <Mail className="h-3.5 w-3.5" /> Email
            </p>
            <p className="text-sm">{trainer.email}</p>
          </div>
          <div className="rounded-xl border border-border bg-surface-2 p-4">
            <p className="mb-1 flex items-center gap-1.5 text-xs text-text-muted">
              <Phone className="h-3.5 w-3.5" /> Telefon
            </p>
            <p className="text-sm">{trainer.phone ?? "—"}</p>
          </div>
          <div className="rounded-xl border border-border bg-surface-2 p-4">
            <p className="mb-1 flex items-center gap-1.5 text-xs text-text-muted">
              <Cake className="h-3.5 w-3.5" /> Data nașterii
            </p>
            <p className="text-sm">
              {trainer.birthDate
                ? `${new Date(trainer.birthDate).toLocaleDateString("ro-RO")}${trainerAge ? ` (${trainerAge} ani)` : ""}`
                : "—"}
            </p>
          </div>
          <div className="rounded-xl border border-border bg-surface-2 p-4">
            <p className="mb-1 flex items-center gap-1.5 text-xs text-text-muted">
              <Briefcase className="h-3.5 w-3.5" /> Ani experiență
            </p>
            <p className="text-sm">{trainer.yearsExperience ?? "—"}</p>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="mb-4 flex items-center gap-2 text-base font-semibold">
            <Award className="h-4 w-4 text-accent" />
            Certificări
          </h2>
          {certifications.length === 0 ? (
            <p className="text-sm text-text-faint">Nicio certificare încărcată.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {certifications.map((c) => (
                <li key={c.id}>
                  <a
                    href={c.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between rounded-lg border border-border-soft px-3 py-2 text-sm transition-colors hover:border-border hover:bg-surface-2"
                  >
                    <span>{c.name}</span>
                    <span className="text-xs text-text-muted">Descarcă</span>
                  </a>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <h2 className="mb-4 flex items-center gap-2 text-base font-semibold">
            <GraduationCap className="h-4 w-4 text-accent" />
            Diplome
          </h2>
          {diplomas.length === 0 ? (
            <p className="text-sm text-text-faint">Nicio diplomă încărcată.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {diplomas.map((d) => (
                <li key={d.id}>
                  <a
                    href={d.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between rounded-lg border border-border-soft px-3 py-2 text-sm transition-colors hover:border-border hover:bg-surface-2"
                  >
                    <span>{d.name}</span>
                    <span className="text-xs text-text-muted">Descarcă</span>
                  </a>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
