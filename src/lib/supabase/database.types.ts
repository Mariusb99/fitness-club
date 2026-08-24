// Tipuri simplificate, scrise manual, pentru schema din supabase/schema.sql.
// Pot fi înlocuite oricând cu tipuri generate automat:
//   npx supabase gen types typescript --project-id <id> > database.types.ts

export type UserRole = "admin" | "trainer";
export type ClientStatusRow = "activ" | "suspendat" | "inactiv";
export type PhotoTypeRow = "before" | "after" | "progress";
export type PhotoAngleRow = "fata" | "spate" | "lateral_stanga" | "lateral_dreapta";
export type DocumentKindRow = "certificare" | "diploma";
export type AuditActionRow = "creare" | "modificare" | "stergere";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          role: UserRole;
          full_name: string;
          email: string;
          phone: string | null;
          avatar_url: string | null;
          birth_date: string | null;
          years_experience: number | null;
          specializations: string[];
          bio: string | null;
          is_active: boolean;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["profiles"]["Row"]> & {
          id: string;
          full_name: string;
          email: string;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Row"]>;
        Relationships: [];
      };
      trainer_documents: {
        Row: {
          id: string;
          trainer_id: string;
          kind: DocumentKindRow;
          name: string;
          file_path: string;
          uploaded_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["trainer_documents"]["Row"]> & {
          trainer_id: string;
          kind: DocumentKindRow;
          name: string;
          file_path: string;
        };
        Update: Partial<Database["public"]["Tables"]["trainer_documents"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "trainer_documents_trainer_id_fkey";
            columns: ["trainer_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      clients: {
        Row: {
          id: string;
          trainer_id: string;
          full_name: string;
          email: string | null;
          phone: string | null;
          birth_date: string | null;
          gender: "M" | "F" | null;
          status: ClientStatusRow;
          goals: string | null;
          notes: string | null;
          created_at: string;
          created_by: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["clients"]["Row"]> & {
          trainer_id: string;
          full_name: string;
        };
        Update: Partial<Database["public"]["Tables"]["clients"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "clients_trainer_id_fkey";
            columns: ["trainer_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      client_anamnesis: {
        Row: {
          client_id: string;
          medical_conditions: string | null;
          medications: string | null;
          injuries: string | null;
          allergies: string | null;
          contraindications: string | null;
          notes: string | null;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["client_anamnesis"]["Row"]> & {
          client_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["client_anamnesis"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "client_anamnesis_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: true;
            referencedRelation: "clients";
            referencedColumns: ["id"];
          },
        ];
      };
      measurements: {
        Row: {
          id: string;
          client_id: string;
          recorded_at: string;
          is_initial: boolean;
          weight_kg: number;
          height_cm: number;
          arms_cm: number | null;
          chest_cm: number | null;
          waist_cm: number | null;
          hips_cm: number | null;
          thigh_cm: number | null;
          calf_cm: number | null;
          notes: string | null;
          created_by: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["measurements"]["Row"]> & {
          client_id: string;
          weight_kg: number;
          height_cm: number;
        };
        Update: Partial<Database["public"]["Tables"]["measurements"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "measurements_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: false;
            referencedRelation: "clients";
            referencedColumns: ["id"];
          },
        ];
      };
      client_photos: {
        Row: {
          id: string;
          client_id: string;
          measurement_id: string | null;
          photo_type: PhotoTypeRow;
          angle: PhotoAngleRow;
          file_path: string;
          taken_at: string;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["client_photos"]["Row"]> & {
          client_id: string;
          file_path: string;
        };
        Update: Partial<Database["public"]["Tables"]["client_photos"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "client_photos_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: false;
            referencedRelation: "clients";
            referencedColumns: ["id"];
          },
        ];
      };
      audit_log: {
        Row: {
          id: string;
          actor_id: string | null;
          action: AuditActionRow;
          entity_type: string;
          entity_label: string;
          summary: string;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["audit_log"]["Row"]> & {
          action: AuditActionRow;
          entity_type: string;
          entity_label: string;
          summary: string;
        };
        Update: Partial<Database["public"]["Tables"]["audit_log"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "audit_log_actor_id_fkey";
            columns: ["actor_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
