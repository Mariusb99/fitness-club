export type Role = "admin" | "trainer";

export type ClientStatus = "activ" | "suspendat" | "inactiv";

export interface Profile {
  id: string;
  role: Role;
  fullName: string;
  email: string;
  phone: string | null;
  avatarUrl: string | null;
  birthDate: string | null;
  yearsExperience: number | null;
  specializations: string[];
  bio: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface Document {
  id: string;
  trainerId: string;
  kind: "certificare" | "diploma";
  name: string;
  fileUrl: string;
  uploadedAt: string;
}

export interface Anamnesis {
  medicalConditions: string | null;
  medications: string | null;
  injuries: string | null;
  allergies: string | null;
  contraindications: string | null;
  notes: string | null;
}

export interface Measurement {
  id: string;
  clientId: string;
  recordedAt: string;
  isInitial: boolean;
  weightKg: number;
  heightCm: number;
  arms: number | null;
  chest: number | null;
  waist: number | null;
  hips: number | null;
  thigh: number | null;
  calf: number | null;
  notes: string | null;
}

/** Momentul din program în care e făcută fotografia. */
export type PhotoType = "before" | "after" | "progress";

/** Unghiul din care e făcută fotografia. */
export type PhotoAngle = "fata" | "spate" | "lateral_stanga" | "lateral_dreapta";

export const PHOTO_ANGLE_LABELS: Record<PhotoAngle, string> = {
  fata: "Față",
  spate: "Spate",
  lateral_stanga: "Lateral stânga",
  lateral_dreapta: "Lateral dreapta",
};

export const PHOTO_ANGLES: PhotoAngle[] = [
  "fata",
  "spate",
  "lateral_stanga",
  "lateral_dreapta",
];

export const PHOTO_TYPE_LABELS: Record<PhotoType, string> = {
  before: "Înainte",
  progress: "Progres",
  after: "După",
};

export interface ClientPhoto {
  id: string;
  clientId: string;
  measurementId: string | null;
  photoType: PhotoType;
  angle: PhotoAngle;
  /** Calea din bucketul privat — necesară la ștergerea fișierului. */
  path: string;
  /** URL semnat, valabil temporar (bucketul nu e public). */
  url: string;
  takenAt: string;
}

export interface Client {
  id: string;
  trainerId: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  birthDate: string | null;
  gender: "M" | "F" | null;
  status: ClientStatus;
  goals: string | null;
  notes: string | null;
  createdAt: string;
  anamnesis: Anamnesis | null;
  measurements: Measurement[];
  photos: ClientPhoto[];
}

export interface AuditLogEntry {
  id: string;
  actorId: string;
  actorName: string;
  action: "creare" | "modificare" | "stergere";
  entityType: "client" | "masuratoare" | "utilizator" | "profil";
  entityLabel: string;
  summary: string;
  createdAt: string;
}

export function bmi(weightKg: number, heightCm: number): number {
  if (!heightCm) return 0;
  const heightM = heightCm / 100;
  return weightKg / (heightM * heightM);
}

export function age(birthDate: string | null): number | null {
  if (!birthDate) return null;
  const dob = new Date(birthDate);
  if (Number.isNaN(dob.getTime())) return null;
  const today = new Date();
  let years = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) years--;
  return years;
}

export function initials(fullName: string): string {
  return fullName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}
