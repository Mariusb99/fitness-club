import "server-only";
import { isSupabaseConfigured } from "../supabase/env";
import { createClient } from "../supabase/server";
import { SEED_AUDIT_LOG } from "../seed";
import type { AuditLogEntry } from "../types";

export async function listAuditLog(): Promise<AuditLogEntry[]> {
  if (!isSupabaseConfigured()) {
    return SEED_AUDIT_LOG;
  }
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("audit_log")
    .select("*, profiles(full_name)")
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) throw error;

  return (data ?? []).map((row) => ({
    id: row.id,
    actorId: row.actor_id ?? "",
    actorName:
      (row as unknown as { profiles: { full_name: string } | null }).profiles?.full_name ??
      "Sistem",
    action: row.action,
    entityType: row.entity_type as AuditLogEntry["entityType"],
    entityLabel: row.entity_label,
    summary: row.summary,
    createdAt: row.created_at,
  }));
}

export async function recordAuditLog(entry: {
  actorId: string;
  action: AuditLogEntry["action"];
  entityType: string;
  entityLabel: string;
  summary: string;
}) {
  if (!isSupabaseConfigured()) return;
  const supabase = await createClient();
  await supabase.from("audit_log").insert({
    actor_id: entry.actorId,
    action: entry.action,
    entity_type: entry.entityType,
    entity_label: entry.entityLabel,
    summary: entry.summary,
  });
}
