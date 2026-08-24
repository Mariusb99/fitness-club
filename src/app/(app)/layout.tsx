import { requireProfile } from "@/lib/auth";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireProfile();

  return (
    <div className="flex min-h-screen flex-1">
      <Sidebar profile={profile} />
      <div className="flex min-w-0 flex-1 flex-col">
        <MobileNav profile={profile} />
        {!isSupabaseConfigured() && (
          <div className="border-b border-accent-soft-border bg-accent-soft px-4 py-2 text-center text-xs text-accent">
            Mod demo — Supabase nu este încă conectat, se afișează date exemplu. Conectează
            proiectul Supabase pentru date reale.
          </div>
        )}
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  );
}
