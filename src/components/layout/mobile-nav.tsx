"use client";

import { useEffect, useState } from "react";
import { Dumbbell, Menu, X } from "lucide-react";
import { Nav } from "./nav";
import { UserCard } from "./user-card";
import type { Profile } from "@/lib/types";

/**
 * Bara de sus + meniul lateral („hamburger") pentru telefon și tabletă.
 * Pe ecrane mari e ascunsă complet — acolo rămâne sidebar-ul fix.
 */
export function MobileNav({ profile }: { profile: Profile }) {
  const [open, setOpen] = useState(false);

  // Cât timp meniul e deschis, blocăm scroll-ul paginii din spate și
  // permitem închiderea din tasta Escape.
  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <>
      <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-border bg-bg/95 px-4 py-3 backdrop-blur lg:hidden">
        <button
          onClick={() => setOpen(true)}
          aria-label="Deschide meniul"
          aria-expanded={open}
          className="flex h-11 w-11 items-center justify-center rounded-lg border border-border text-text-muted transition-colors hover:bg-surface-hover hover:text-text"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-white">
            <Dumbbell className="h-4 w-4" />
          </div>
          <span className="text-sm font-semibold tracking-tight">Fitness Club</span>
        </div>
      </header>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            aria-label="Închide meniul"
            onClick={() => setOpen(false)}
            className="absolute inset-0 h-full w-full bg-black/60"
          />
          <div className="relative flex h-full w-[17rem] max-w-[85vw] flex-col border-r border-border bg-bg px-4 py-5">
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent text-white">
                  <Dumbbell className="h-5 w-5" />
                </div>
                <span className="text-base font-semibold tracking-tight">Fitness Club</span>
              </div>
              <button
                onClick={() => setOpen(false)}
                aria-label="Închide meniul"
                className="flex h-10 w-10 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-surface-hover hover:text-text"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              <Nav isAdmin={profile.role === "admin"} onNavigate={() => setOpen(false)} />
            </div>

            <div className="mt-4">
              <UserCard profile={profile} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
