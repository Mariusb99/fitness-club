import {
  LayoutGrid,
  Users,
  BarChart3,
  UsersRound,
  UserCog,
  History,
  IdCard,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  adminOnly?: boolean;
}

/**
 * Sursa unică pentru meniul de navigație — folosită atât de sidebar-ul
 * de desktop, cât și de meniul „hamburger" de pe telefon, ca să nu
 * existe două liste care pot ajunge nesincronizate.
 */
export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutGrid },
  { href: "/clienti", label: "Clienți", icon: Users },
  { href: "/rapoarte", label: "Rapoarte", icon: BarChart3 },
  { href: "/antrenori", label: "Antrenori", icon: UsersRound, adminOnly: true },
  { href: "/utilizatori", label: "Utilizatori", icon: UserCog, adminOnly: true },
  { href: "/jurnal", label: "Jurnal acțiuni", icon: History, adminOnly: true },
  { href: "/profil", label: "Profilul meu", icon: IdCard },
];

export function navItemsFor(isAdmin: boolean): NavItem[] {
  return NAV_ITEMS.filter((item) => !item.adminOnly || isAdmin);
}
