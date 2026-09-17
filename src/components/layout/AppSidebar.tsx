import { Link, useLocation } from "react-router-dom";
import { X } from "lucide-react";

import { cn } from "@/lib/utils";
import { isNavItemActive, primaryNav, secondaryNav, type NavItem } from "./navigation";

function NavRow({ item, pathname }: { item: NavItem; pathname: string }) {
  const Icon = item.icon;
  const active = isNavItemActive(item, pathname);

  const content = (
    <>
      <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
      <span className="truncate">{item.label}</span>
    </>
  );

  if (!item.to) {
    // Rendered as a disabled row, not a link: there is nothing behind it yet,
    // and a nav item that goes nowhere is worse than one that says so.
    return (
      <span
        aria-disabled="true"
        title={`${item.label} is not available yet`}
        className="nav-row cursor-not-allowed text-ink-400"
      >
        {content}
        {item.comingSoon && (
          <span className="ml-auto rounded-full border border-line px-1.5 py-px text-[10px] font-semibold uppercase tracking-wide text-ink-400">
            Soon
          </span>
        )}
      </span>
    );
  }

  return (
    <Link
      to={item.to}
      aria-current={active ? "page" : undefined}
      className={cn("nav-row", active ? "nav-row-active" : "nav-row-idle")}
    >
      {content}
    </Link>
  );
}

function SidebarBody({ onNavigate }: { onNavigate?: () => void }) {
  const { pathname } = useLocation();

  return (
    <nav
      aria-label="Primary"
      className="flex h-full flex-col gap-0.5 overflow-y-auto px-3 py-4"
      onClick={onNavigate}
    >
      <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-400">
        Workspace
      </p>

      {primaryNav.map((item) => (
        <NavRow key={item.label} item={item} pathname={pathname} />
      ))}

      <div className="my-3 border-t border-sidebar-line" />

      {secondaryNav.map((item) => (
        <NavRow key={item.label} item={item} pathname={pathname} />
      ))}

      {/* A rule and a line of small type close the column, rather than the
          list simply stopping in the middle of the panel. */}
      <div className="mt-auto border-t border-sidebar-line px-3 pt-3">
        <p className="text-[11px] leading-relaxed text-ink-400">
          Notes are written from transcripts and kept to your account alone.
        </p>
      </div>
    </nav>
  );
}

interface AppSidebarProps {
  /** Mobile drawer visibility. The desktop sidebar is always present. */
  isOpen: boolean;
  onClose: () => void;
}

export function AppSidebar({ isOpen, onClose }: AppSidebarProps) {
  return (
    <>
      {/* Desktop: a permanent column, narrower on tablet. It owns the brand
          here - the top bar only shows the logo below `lg`, where this column
          has collapsed into a drawer. */}
      <aside className="hidden w-60 shrink-0 flex-col border-r border-sidebar-line bg-sidebar lg:flex xl:w-64 print:hidden">
        <Link
          to="/dashboard"
          className="flex items-center gap-3 border-b border-sidebar-line px-4 py-3.5"
        >
          <img
            src="/logo-tile.png"
            alt=""
            width={34}
            height={34}
            className="h-[34px] w-[34px] shrink-0 rounded-lg object-cover"
          />
          <span className="min-w-0">
            <span className="block truncate font-display text-[15px] font-semibold tracking-tight text-ink-900">
              V-Notes AI
            </span>
            <span className="block truncate text-[11px] text-ink-500">
              Watch less. Learn more.
            </span>
          </span>
        </Link>
        <div className="min-h-0 flex-1">
          <SidebarBody />
        </div>
      </aside>

      {/* Mobile and tablet: the same navigation as a drawer. Kept mounted and
          translated off-screen so it animates both ways. */}
      <div
        className={cn(
          "fixed inset-0 z-50 lg:hidden print:hidden",
          isOpen ? "pointer-events-auto" : "pointer-events-none",
        )}
        aria-hidden={!isOpen}
      >
        <div
          onClick={onClose}
          className={cn(
            "absolute inset-0 bg-night-900/60 transition-opacity duration-200",
            isOpen ? "opacity-100" : "opacity-0",
          )}
        />
        <div
          className={cn(
            "absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col border-r border-sidebar-line bg-sidebar shadow-lg transition-transform duration-200 ease-out",
            isOpen ? "translate-x-0" : "-translate-x-full",
          )}
        >
          <div className="flex items-center justify-between border-b border-sidebar-line px-4 py-3">
            <Link to="/dashboard" onClick={onClose} className="flex items-center gap-2.5">
              <img
                src="/logo-tile.png"
                alt=""
                width={28}
                height={28}
                className="h-7 w-7 rounded-lg object-cover"
              />
              <span className="font-display text-base font-semibold tracking-tight text-ink-900">
                V-Notes AI
              </span>
            </Link>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close navigation"
              className="rounded-lg p-1.5 text-ink-500 transition-colors hover:bg-paper-200 hover:text-ink-900"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="min-h-0 flex-1">
            <SidebarBody onNavigate={onClose} />
          </div>
        </div>
      </div>
    </>
  );
}
