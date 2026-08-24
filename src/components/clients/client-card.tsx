import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { age } from "@/lib/types";
import type { Client } from "@/lib/types";

const STATUS_VARIANT = {
  activ: "success",
  suspendat: "warning",
  inactiv: "neutral",
} as const;

const STATUS_LABEL = {
  activ: "Activ",
  suspendat: "Suspendat",
  inactiv: "Inactiv",
} as const;

export function ClientCard({ client, trainerName }: { client: Client; trainerName: string }) {
  const clientAge = age(client.birthDate);
  const last = client.measurements[client.measurements.length - 1];

  return (
    <Link
      href={`/clienti/${client.id}`}
      className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-5 transition-colors hover:border-accent-soft-border hover:bg-surface-hover"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <Avatar name={client.fullName} />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{client.fullName}</p>
            <p className="truncate text-xs text-text-muted">{client.email ?? "—"}</p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-text-muted">
        <span>
          {clientAge ? `${clientAge} ani` : "—"}
          {last ? ` · ${last.heightCm} cm` : ""}
        </span>
        <Badge variant={STATUS_VARIANT[client.status]}>{STATUS_LABEL[client.status]}</Badge>
      </div>

      <div className="border-t border-border-soft pt-3 text-xs text-text-muted">
        {trainerName}
      </div>
    </Link>
  );
}
