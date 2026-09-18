import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  ChevronDown,
  FileText,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Monitor,
  Moon,
  Sun,
  Upload,
  User,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { useAuth } from "../../hooks/useAuth";
import { useTheme } from "../../hooks/useTheme";
import type { Theme } from "../../lib/theme";

const menuItems = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/submit", icon: Upload, label: "Process New Video" },
  { to: "/notes", icon: FileText, label: "My Notes" },
  { to: "/quiz", icon: GraduationCap, label: "Quiz Dashboard" },
  { to: "/profile", icon: User, label: "Profile" },
];

const themeOptions: Array<{ value: Theme; icon: typeof Sun; label: string }> = [
  { value: "light", icon: Sun, label: "Light" },
  { value: "dark", icon: Moon, label: "Dark" },
  { value: "system", icon: Monitor, label: "System" },
];

/**
 * The account menu.
 *
 * Lifted out of the old header unchanged in behaviour: the same routes, the
 * same three-way theme control, the same sign-out. Only its appearance and the
 * open/close affordances have been reworked.
 */
export function UserMenu() {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const displayName = user?.full_name || "User";
  const location = useLocation();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // The menu is the only route to Profile and Sign Out, so it has to close
  // reliably: a click anywhere else, Escape, or simply arriving somewhere new.
  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!isMenuOpen) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsMenuOpen(false);
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isMenuOpen]);

  const avatar = (size: "sm" | "md") => {
    const box = size === "sm" ? "h-8 w-8 text-xs" : "h-10 w-10 text-sm";
    return user?.avatar_url ? (
      <img
        src={user.avatar_url}
        alt=""
        className={cn("shrink-0 rounded-full border border-line object-cover", box)}
      />
    ) : (
      <div
        className={cn(
          "flex shrink-0 items-center justify-center rounded-full bg-accent-100 font-semibold uppercase text-accent-700",
          box,
        )}
      >
        {displayName.charAt(0)}
      </div>
    );
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsMenuOpen((open) => !open)}
        aria-haspopup="menu"
        aria-expanded={isMenuOpen}
        aria-label="Account menu"
        className={cn(
          "flex items-center gap-2 rounded-full border border-transparent py-1 pl-1 pr-1.5 transition-colors sm:pl-3",
          isMenuOpen ? "border-line bg-paper-200" : "hover:bg-paper-200",
        )}
      >
        <span className="hidden text-sm text-ink-500 md:inline">
          Welcome, <span className="font-semibold text-ink-900">{displayName}</span>
        </span>
        {avatar("sm")}
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-ink-400 transition-transform duration-150",
            isMenuOpen && "rotate-180",
          )}
        />
      </button>

      {isMenuOpen && (
        <div
          role="menu"
          aria-label="Account"
          className="absolute right-0 z-50 mt-2 w-72 max-w-[calc(100vw-1.5rem)] origin-top-right animate-[menu-in_120ms_ease-out] overflow-hidden rounded-xl border border-line bg-paper-50 shadow-lg"
        >
          <div className="flex items-center gap-3 border-b border-line px-4 py-3.5">
            {avatar("md")}
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-ink-900">{displayName}</p>
              {user?.email && <p className="truncate text-xs text-ink-500">{user.email}</p>}
            </div>
          </div>

          <nav className="p-1.5">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.to;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  role="menuitem"
                  className={cn("nav-row", isActive ? "nav-row-active" : "nav-row-idle")}
                >
                  <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="border-t border-line px-3 py-2.5">
            <p className="pb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-400">
              Theme
            </p>
            <div className="flex gap-1.5">
              {themeOptions.map((option) => {
                const Icon = option.icon;
                const isActive = theme === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setTheme(option.value)}
                    aria-pressed={isActive}
                    className={cn(
                      "flex flex-1 flex-col items-center gap-1.5 rounded-lg border px-2 py-2 text-[11px] font-medium transition-colors duration-150",
                      isActive
                        ? "border-accent-200 bg-accent-50 text-accent-700"
                        : "border-transparent text-ink-500 hover:bg-paper-200 hover:text-ink-900",
                    )}
                  >
                    <Icon className="h-4 w-4" aria-hidden="true" />
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="border-t border-line p-1.5">
            <button
              type="button"
              role="menuitem"
              onClick={() => logout()}
              className="nav-row w-full text-ink-600 transition-colors hover:bg-danger-50 hover:text-danger-700"
            >
              <LogOut className="h-4 w-4 shrink-0" aria-hidden="true" />
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
