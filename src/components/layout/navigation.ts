import {
  FileText,
  GraduationCap,
  LayoutDashboard,
  Settings,
  Star,
  Trash2,
  Upload,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  label: string;
  icon: LucideIcon;
  /** Omitted for an item that has no destination yet. */
  to?: string;
  /**
   * True for a section that is designed but has nothing behind it. It renders
   * disabled with a "Soon" badge rather than as a link, because a nav item that
   * navigates nowhere - or worse, to a page of invented data - is a lie about
   * what the product does.
   */
  comingSoon?: boolean;
  /** Also treat these path prefixes as this item being the current section. */
  matches?: string[];
}

/**
 * The primary navigation, shared by the sidebar and the account menu so the two
 * can never drift apart.
 *
 * Favorites and Trash have no API behind them: nothing stores a favourite, and
 * a deleted video is removed outright rather than kept. They are listed because
 * the navigation is designed around them, but they stay disabled until there is
 * something real to open.
 */
export const primaryNav: NavItem[] = [
  { label: "Dashboard", icon: LayoutDashboard, to: "/dashboard" },
  { label: "Process New Video", icon: Upload, to: "/submit" },
  { label: "My Notes", icon: FileText, to: "/notes", matches: ["/notes"] },
  { label: "Quiz Dashboard", icon: GraduationCap, to: "/quiz", matches: ["/quiz"] },
  { label: "Favorites", icon: Star, comingSoon: true },
  { label: "Trash", icon: Trash2, comingSoon: true },
];

/**
 * Below the divider. Settings points at the profile page, which is where every
 * account setting already lives - a second "Profile" row in the sidebar would
 * only duplicate the account menu.
 */
export const secondaryNav: NavItem[] = [
  { label: "Settings", icon: Settings, to: "/profile" },
];

/** Whether `item` is the section the current path belongs to. */
export function isNavItemActive(item: NavItem, pathname: string): boolean {
  if (!item.to) return false;
  if (pathname === item.to) return true;
  return (item.matches ?? []).some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}
