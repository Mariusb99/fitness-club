"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";
import { navItemsFor } from "./nav-items";

export function Nav({
  isAdmin,
  onNavigate,
}: {
  isAdmin: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const items = navItemsFor(isAdmin);

  return (
    <nav className="flex flex-1 flex-col gap-1">
      {items.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={clsx(
              // min-h-11 = ~44px, dimensiunea minimă recomandată pentru
              // o zonă de atins cu degetul pe telefon.
              "flex min-h-11 items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
              active
                ? "bg-accent-soft text-accent font-medium"
                : "text-text-muted hover:bg-surface-hover hover:text-text",
            )}
          >
            <Icon className="h-[18px] w-[18px] shrink-0" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
