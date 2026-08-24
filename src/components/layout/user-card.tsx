import { LogOut, ShieldCheck } from "lucide-react";
import { logout } from "@/app/(auth)/login/actions";
import { Avatar } from "@/components/ui/avatar";
import type { Profile } from "@/lib/types";

/** Cartela de jos cu utilizatorul curent + butonul de deconectare. */
export function UserCard({ profile }: { profile: Profile }) {
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-border bg-surface p-3">
      <div className="flex items-center gap-2.5">
        <Avatar name={profile.fullName} size="sm" />
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{profile.fullName}</p>
          <p className="flex items-center gap-1 text-xs text-accent">
            <ShieldCheck className="h-3 w-3" />
            {profile.role === "admin" ? "Administrator" : "Antrenor"}
          </p>
        </div>
      </div>
      <form action={logout}>
        <button
          type="submit"
          className="flex min-h-10 w-full items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-text-muted transition-colors hover:bg-surface-hover hover:text-text"
        >
          <LogOut className="h-3.5 w-3.5" />
          Deconectare
        </button>
      </form>
    </div>
  );
}
