import { Search } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { listUsersForAdmin } from "@/lib/data/users";
import { Card } from "@/components/ui/card";
import { CreateUserForm } from "@/components/users/create-user-form";
import { UserRow } from "@/components/users/user-row";

const selectClass =
  "min-h-11 rounded-lg border border-border bg-surface px-3 py-2.5 text-sm outline-none focus:border-accent";

export default async function UtilizatoriPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; rol?: string; stare?: string }>;
}) {
  const admin = await requireAdmin();
  const params = await searchParams;
  const users = await listUsersForAdmin();

  const q = (params.q ?? "").trim().toLowerCase();
  const roleFilter = params.rol ?? "";
  const stateFilter = params.stare ?? "";

  const filtered = users.filter(({ profile }) => {
    if (q) {
      const haystack = `${profile.fullName} ${profile.email}`.toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    if (roleFilter && profile.role !== roleFilter) return false;
    if (stateFilter === "activ" && !profile.isActive) return false;
    if (stateFilter === "dezactivat" && profile.isActive) return false;
    return true;
  });

  const activeCount = users.filter((u) => u.profile.isActive).length;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Utilizatori</h1>
          <p className="text-sm text-text-muted">
            {users.length} {users.length === 1 ? "cont" : "conturi"} · {activeCount} active.
            Conturile se creează exclusiv de către administrator.
          </p>
        </div>
        <CreateUserForm />
      </div>

      <form className="flex flex-wrap items-center gap-3" action="/utilizatori" method="GET">
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-faint" />
          <input
            type="text"
            name="q"
            defaultValue={params.q}
            placeholder="Caută după nume sau email..."
            className="min-h-11 w-full rounded-lg border border-border bg-surface py-2.5 pl-9 pr-3 text-sm outline-none focus:border-accent"
          />
        </div>
        <select name="rol" defaultValue={roleFilter} className={selectClass}>
          <option value="">Toate rolurile</option>
          <option value="admin">Administratori</option>
          <option value="trainer">Antrenori</option>
        </select>
        <select name="stare" defaultValue={stateFilter} className={selectClass}>
          <option value="">Toate stările</option>
          <option value="activ">Doar active</option>
          <option value="dezactivat">Doar dezactivate</option>
        </select>
        <button
          type="submit"
          className="min-h-11 rounded-lg border border-border px-4 py-2.5 text-sm text-text-muted transition-colors hover:bg-surface-hover hover:text-text"
        >
          Filtrează
        </button>
      </form>

      <Card>
        <div className="flex flex-col gap-2.5">
          {filtered.map(({ profile, clientCount, lastSignInAt }) => (
            <UserRow
              key={profile.id}
              user={profile}
              clientCount={clientCount}
              lastSignInAt={lastSignInAt}
              isSelf={profile.id === admin.id}
            />
          ))}
          {filtered.length === 0 && (
            <p className="py-10 text-center text-sm text-text-faint">
              Niciun utilizator nu corespunde filtrelor.
            </p>
          )}
        </div>
      </Card>
    </div>
  );
}
