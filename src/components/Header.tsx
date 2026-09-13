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

import { useAuth } from "../hooks/useAuth";
import { useTheme } from "../hooks/useTheme";
import type { Theme } from "../lib/theme";

const menuItems = [
  { to: "/dashboard", icon: <LayoutDashboard className="h-4 w-4" />, label: "Dashboard" },
  { to: "/submit", icon: <Upload className="h-4 w-4" />, label: "Process New Video" },
  { to: "/notes", icon: <FileText className="h-4 w-4" />, label: "My Notes" },
  { to: "/quiz", icon: <GraduationCap className="h-4 w-4" />, label: "Quiz Dashboard" },
  { to: "/profile", icon: <User className="h-4 w-4" />, label: "Profile" },
];

const themeOptions: Array<{ value: Theme; icon: React.ReactNode; label: string }> = [
  { value: "light", icon: <Sun className="h-4 w-4" />, label: "Light" },
  { value: "dark", icon: <Moon className="h-4 w-4" />, label: "Dark" },
  { value: "system", icon: <Monitor className="h-4 w-4" />, label: "System" },
];

export function Header() {
  const { user, logout } = useAuth();
  const { theme, resolvedTheme, setTheme, toggleTheme } = useTheme();
  const displayName = user?.full_name || "User";
  const location = useLocation();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // The menu is the only route to Profile and Sign Out now that the sidebar is
  // gone, so it has to close reliably: a click anywhere else, Escape, or simply
  // arriving somewhere new.
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

  const avatar = user?.avatar_url ? (
    <img
      src={user.avatar_url}
      alt=""
      className="h-9 w-9 shrink-0 rounded-full border border-line shadow-sm"
    />
  ) : (
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent-100 font-semibold text-accent-700 shadow-sm">
      {displayName.charAt(0)}
    </div>
  );

  return (
    <header className="bg-paper-50 border-b border-line px-4 py-3 sm:px-6 print:hidden">
      <div className="flex items-center justify-between">
        <Link to="/dashboard" className="flex min-w-0 items-center gap-2.5">
          <img
            src="/logo-tile.png"
            alt=""
            width={32}
            height={32}
            className="h-8 w-8 shrink-0 rounded-lg object-cover shadow-sm"
          />
          <h1 className="hidden truncate font-display text-lg font-semibold tracking-tight text-ink-900 sm:block">
            V-Notes AI
          </h1>
        </Link>

        <div className="flex items-center gap-1 sm:gap-2">
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={
              resolvedTheme === "dark" ? "Switch to light mode" : "Switch to dark mode"
            }
            title={resolvedTheme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            className="rounded-full p-2 text-ink-600 transition-colors hover:bg-paper-200 hover:text-ink-900"
          >
            {resolvedTheme === "dark" ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
          </button>

        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setIsMenuOpen((open) => !open)}
            aria-haspopup="menu"
            aria-expanded={isMenuOpen}
            aria-label="Account menu"
            className="flex items-center gap-2 rounded-full py-1 pl-3 pr-1.5 transition-colors hover:bg-paper-200 sm:gap-3"
          >
            <span className="hidden text-sm text-ink-600 sm:inline">
              Welcome, <span className="font-semibold text-ink-900">{displayName}</span>
            </span>
            {avatar}
            <ChevronDown
              className={`h-4 w-4 shrink-0 text-ink-500 transition-transform ${
                isMenuOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {isMenuOpen && (
            <div
              role="menu"
              aria-label="Account"
              className="absolute right-0 z-50 mt-2 w-64 overflow-hidden rounded-xl border border-line bg-paper-50 shadow-lg"
            >
              <div className="flex items-center gap-3 border-b border-line p-4">
                {avatar}
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-ink-900">{displayName}</p>
                  {user?.email && (
                    <p className="truncate text-xs text-ink-500">{user.email}</p>
                  )}
                </div>
              </div>

              <nav className="p-1.5">
                {menuItems.map((item) => {
                  const isActive = location.pathname === item.to;
                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      role="menuitem"
                      className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                        isActive
                          ? "bg-paper-200 text-ink-900"
                          : "text-ink-600 hover:bg-paper-100 hover:text-ink-900"
                      }`}
                    >
                      <span className="shrink-0">{item.icon}</span>
                      <span className="truncate">{item.label}</span>
                    </Link>
                  );
                })}
              </nav>

              <div className="border-t border-line px-1.5 py-2">
                <p className="px-2 pb-1.5 text-[11px] font-semibold uppercase tracking-wide text-ink-500">
                  Theme
                </p>
                <div className="flex gap-1">
                  {themeOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setTheme(option.value)}
                      aria-pressed={theme === option.value}
                      className={`flex flex-1 flex-col items-center gap-1 rounded-lg px-2 py-2 text-[11px] font-medium transition-colors ${
                        theme === option.value
                          ? "bg-paper-200 text-ink-900 ring-1 ring-line-strong"
                          : "text-ink-600 hover:bg-paper-100 hover:text-ink-900"
                      }`}
                    >
                      {option.icon}
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="border-t border-line p-1.5">
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => logout()}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-ink-600 transition-colors hover:bg-paper-100 hover:text-ink-900"
                >
                  <LogOut className="h-4 w-4 shrink-0" />
                  Sign Out
                </button>
              </div>
            </div>
          )}
          </div>
        </div>
      </div>
    </header>
  );
}
