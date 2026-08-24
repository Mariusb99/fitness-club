import { requireProfile } from "@/lib/auth";
import { getTrainerDocuments } from "@/lib/data/trainers";
import { ProfileForm } from "@/components/profile/profile-form";
import { DocumentsForm } from "@/components/profile/documents-form";

export default async function ProfilPage() {
  const profile = await requireProfile();
  const documents = await getTrainerDocuments(profile.id);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Profilul meu</h1>
        <p className="text-sm text-text-muted">
          Datele tale de identitate și profesionale, vizibile administratorului.
        </p>
      </div>
      <ProfileForm profile={profile} />
      <DocumentsForm
        certifications={documents.filter((d) => d.kind === "certificare")}
        diplomas={documents.filter((d) => d.kind === "diploma")}
      />
    </div>
  );
}
