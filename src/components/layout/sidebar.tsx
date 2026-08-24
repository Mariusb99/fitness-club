import { Dumbbell } from "lucide-react";
import { Nav } from "./nav";
import { UserCard } from "./user-card";
import type { Profile } from "@/lib/types";

/**
 * Sidebar-ul fix, vizibil doar de la lățimi de tip laptop în sus.
 * Pe telefon și tabletă îl înlocuiește `MobileNav` (meniu hamburger).
 */
export function Sidebar({ profile }: { profile: Profile }) {
  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-bg px-4 py-5 lg:flex">
      <div className="mb-6 flex items-center gap-2 px-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent text-white">
          <Dumbbell className="h-5 w-5" />
        </div>
        <span className="text-base font-semibold tracking-tight">Fitness Club</span>
      </div>

      <Nav isAdmin={profile.role === "admin"} />

      <div className="mt-4">
        <UserCard profile={profile} />
      </div>
    </aside>
  );
}
