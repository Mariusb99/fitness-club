"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import {
  Check,
  Copy,
  History,
  KeyRound,
  Mail,
  MoreVertical,
  Pencil,
  Power,
  PowerOff,
  Trash2,
  Users,
} from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  deleteUserAction,
  resetUserPasswordAction,
  sendPasswordResetLinkAction,
  setUserActiveAction,
  type UserActionResult,
} from "@/app/(app)/utilizatori/actions";
import { EditUserForm } from "./edit-user-form";
import type { Profile } from "@/lib/types";

type ConfirmKind = "delete" | "deactivate" | "activate" | "reset";

const CONFIRM_COPY: Record<
  ConfirmKind,
  {
    title: (n: string) => string;
    message: string;
    label: string;
    tone: "danger" | "warning";
  }
> = {
  delete: {
    title: (n) => `Ștergi contul lui ${n}?`,
    message:
      "Contul de autentificare și profilul se șterg definitiv. Acțiunea nu poate fi anulată.",
    label: "Șterge definitiv",
    tone: "danger",
  },
  deactivate: {
    title: (n) => `Dezactivezi contul lui ${n}?`,
    message:
      "Nu se va mai putea autentifica, dar clienții, măsurătorile și istoricul rămân neatinse. Poți reactiva contul oricând.",
    label: "Dezactivează",
    tone: "warning",
  },
  activate: {
    title: (n) => `Reactivezi contul lui ${n}?`,
    message: "Va putea din nou să se autentifice cu aceleași date de conectare.",
    label: "Reactivează",
    tone: "warning",
  },
  reset: {
    title: (n) => `Resetezi parola lui ${n}?`,
    message:
      "Se generează o parolă temporară nouă. Parola veche nu va mai funcționa din acel moment.",
    label: "Resetează parola",
    tone: "warning",
  },
};

export function UserRow({
  user,
  clientCount,
  lastSignInAt,
  isSelf,
}: {
  user: Profile;
  clientCount: number;
  lastSignInAt: string | null;
  isSelf: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [menuOpen, setMenuOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [confirmKind, setConfirmKind] = useState<ConfirmKind | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const onPointerDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [menuOpen]);

  function run(action: () => Promise<UserActionResult>) {
    setError(null);
    setNotice(null);
    setTempPassword(null);
    startTransition(async () => {
      const result = await action();
      setError(result.error);
      setNotice(result.notice ?? null);
      setTempPassword(result.password ?? null);
      setConfirmKind(null);
    });
  }

  function onConfirm() {
    if (confirmKind === "delete") run(() => deleteUserAction(user.id, user.fullName));
    if (confirmKind === "deactivate")
      run(() => setUserActiveAction(user.id, user.fullName, false, user.email));
    if (confirmKind === "activate")
      run(() => setUserActiveAction(user.id, user.fullName, true, user.email));
    if (confirmKind === "reset")
      run(() => resetUserPasswordAction(user.id, user.fullName, user.email));
  }

  async function copyPassword() {
    if (!tempPassword) return;
    try {
      await navigator.clipboard.writeText(tempPassword);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  const copy = confirmKind ? CONFIRM_COPY[confirmKind] : null;
  const isTrainer = user.role === "trainer";

  return (
    <div className="rounded-xl border border-border bg-surface-2 px-3 py-3 sm:px-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <Avatar name={user.fullName} size="sm" />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">
              {user.fullName} {isSelf && <span className="text-text-faint">(tu)</span>}
            </p>
            <p className="truncate text-xs text-text-muted">{user.email}</p>
            <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-text-faint">
              {isTrainer && (
                <span className="inline-flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {clientCount} {clientCount === 1 ? "client" : "clienți"}
                </span>
              )}
              <span>
                {lastSignInAt
                  ? `ultima autentificare ${new Date(lastSignInAt).toLocaleDateString("ro-RO", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}`
                  : "fără autentificare înregistrată"}
              </span>
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2 self-start sm:self-center">
          <Badge variant={user.role === "admin" ? "accent" : "neutral"}>
            {user.role === "admin" ? "Administrator" : "Antrenor"}
          </Badge>
          <Badge variant={user.isActive ? "success" : "warning"}>
            {user.isActive ? "Activ" : "Dezactivat"}
          </Badge>

          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen((v) => !v)}
              disabled={pending}
              aria-label={`Acțiuni pentru ${user.fullName}`}
              aria-expanded={menuOpen}
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-border text-text-muted transition-colors hover:bg-surface-hover hover:text-text disabled:opacity-60"
            >
              <MoreVertical className="h-4 w-4" />
            </button>

            {menuOpen && (
              <div className="absolute right-0 z-20 mt-1 w-60 overflow-hidden rounded-xl border border-border bg-surface shadow-xl">
                <MenuItem
                  icon={<Pencil className="h-4 w-4" />}
                  label="Editează datele"
                  onClick={() => {
                    setMenuOpen(false);
                    setEditing(true);
                  }}
                />
                <MenuItem
                  icon={<KeyRound className="h-4 w-4" />}
                  label="Resetează parola"
                  onClick={() => {
                    setMenuOpen(false);
                    setConfirmKind("reset");
                  }}
                />
                <MenuItem
                  icon={<Mail className="h-4 w-4" />}
                  label="Trimite link de resetare"
                  onClick={() => {
                    setMenuOpen(false);
                    run(() => sendPasswordResetLinkAction(user.id, user.fullName, user.email));
                  }}
                />
                <MenuItem
                  icon={<History className="h-4 w-4" />}
                  label="Vezi acțiunile în jurnal"
                  href={`/jurnal?actor=${user.id}`}
                  onClick={() => setMenuOpen(false)}
                />
                {!isSelf && (
                  <>
                    <div className="h-px bg-border" />
                    <MenuItem
                      icon={
                        user.isActive ? (
                          <PowerOff className="h-4 w-4" />
                        ) : (
                          <Power className="h-4 w-4" />
                        )
                      }
                      label={user.isActive ? "Dezactivează contul" : "Reactivează contul"}
                      tone="warning"
                      onClick={() => {
                        setMenuOpen(false);
                        setConfirmKind(user.isActive ? "deactivate" : "activate");
                      }}
                    />
                    <MenuItem
                      icon={<Trash2 className="h-4 w-4" />}
                      label="Șterge contul"
                      tone="danger"
                      onClick={() => {
                        setMenuOpen(false);
                        setConfirmKind("delete");
                      }}
                    />
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {editing && (
        <div className="mt-3 border-t border-border pt-3">
          <EditUserForm
            user={user}
            isSelf={isSelf}
            onDone={() => setEditing(false)}
            onCancel={() => setEditing(false)}
          />
        </div>
      )}

      {error && (
        <p className="mt-2 rounded-lg border border-accent-soft-border bg-accent-soft px-3 py-2 text-xs text-accent">
          {error}
        </p>
      )}
      {notice && !error && (
        <p className="mt-2 rounded-lg border border-success/30 bg-success-soft px-3 py-2 text-xs text-success">
          {notice}
        </p>
      )}
      {tempPassword && (
        <div className="mt-2 flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2">
          <code className="min-w-0 flex-1 truncate font-mono text-xs">{tempPassword}</code>
          <button
            onClick={copyPassword}
            className="flex h-9 shrink-0 items-center gap-1.5 rounded-lg border border-border px-2.5 text-xs text-text-muted transition-colors hover:bg-surface-hover hover:text-text"
          >
            {copied ? (
              <Check className="h-3.5 w-3.5 text-success" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
            {copied ? "Copiat" : "Copiază"}
          </button>
        </div>
      )}

      {copy && (
        <ConfirmDialog
          open
          title={copy.title(user.fullName)}
          message={copy.message}
          confirmLabel={copy.label}
          tone={copy.tone}
          pending={pending}
          onConfirm={onConfirm}
          onCancel={() => setConfirmKind(null)}
        />
      )}
    </div>
  );
}

function MenuItem({
  icon,
  label,
  onClick,
  href,
  tone = "default",
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  href?: string;
  tone?: "default" | "warning" | "danger";
}) {
  const toneClass =
    tone === "danger"
      ? "text-danger hover:bg-danger-soft"
      : tone === "warning"
        ? "text-warning hover:bg-warning-soft"
        : "text-text-muted hover:bg-surface-hover hover:text-text";
  const className = `flex min-h-11 w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm transition-colors ${toneClass}`;

  if (href) {
    return (
      <Link href={href} onClick={onClick} className={className}>
        {icon}
        {label}
      </Link>
    );
  }
  return (
    <button onClick={onClick} className={className}>
      {icon}
      {label}
    </button>
  );
}
