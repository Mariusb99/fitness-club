import type { Profile } from "../types";
import type { Database } from "./database.types";

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

export function mapProfileRow(row: ProfileRow): Profile {
  return {
    id: row.id,
    role: row.role,
    fullName: row.full_name,
    email: row.email,
    phone: row.phone,
    avatarUrl: row.avatar_url,
    birthDate: row.birth_date,
    yearsExperience: row.years_experience,
    specializations: row.specializations ?? [],
    bio: row.bio,
    isActive: row.is_active ?? true,
    createdAt: row.created_at,
  };
}
