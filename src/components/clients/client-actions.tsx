"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { deleteClientAction, updateClientStatusAction } from "@/app/(app)/clienti/actions";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import type { ClientStatus } from "@/lib/types";

export function StatusSelect({ clientId, status }: { clientId: string; status: ClientStatus }) {
  const [pending, startTransition] = useTransition();

  return (
    <select
      defaultValue={status}
      disabled={pending}
      aria-label="Status client"
      onChange={(e) =>
        startTransition(() =>
          updateClientStatusAction(clientId, e.target.value as "activ" | "suspendat" | "inactiv"),
        )
      }
      className="min-h-11 rounded-lg border border-border bg-surface-2 px-3 py-1.5 text-xs font-medium outline-none focus:border-accent disabled:opacity-60"
    >
      <option value="activ">Activ</option>
      <option value="suspendat">Suspendat</option>
      <option value="inactiv">Inactiv</option>
    </select>
  );
}

export function DeleteClientButton({
  clientId,
  clientName,
}: {
  clientId: string;
  clientName: string;
}) {
  const [pending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);

  return (
    <>
      <button
        disabled={pending}
        onClick={() => setConfirming(true)}
        className="flex min-h-11 items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-text-muted transition-colors hover:border-danger/40 hover:text-danger disabled:opacity-60"
      >
        <Trash2 className="h-3.5 w-3.5" />
        Șterge
      </button>

      <ConfirmDialog
        open={confirming}
        title={`Ștergi clientul ${clientName}?`}
        message="Se șterg definitiv fișa, măsurătorile, anamneza și fotografiile acestui client. Acțiunea nu poate fi anulată."
        confirmLabel="Șterge definitiv"
        pending={pending}
        onConfirm={() => startTransition(() => deleteClientAction(clientId, clientName))}
        onCancel={() => setConfirming(false)}
      />
    </>
  );
}
