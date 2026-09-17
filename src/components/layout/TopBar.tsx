import { Link } from "react-router-dom";
import { Menu, Moon, Sun } from "lucide-react";

import { useTheme } from "../../hooks/useTheme";
import { GlobalSearch } from "./GlobalSearch";
import { NotificationsMenu } from "./NotificationsMenu";
import { UserMenu } from "./UserMenu";

interface TopBarProps {
  onOpenSidebar: () => void;
}

export function TopBar({ onOpenSidebar }: TopBarProps) {
  const { resolvedTheme, toggleTheme } = useTheme();

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-paper-50/95 backdrop-blur supports-[backdrop-filter]:bg-paper-50/80 print:hidden">
      <div className="flex h-14 items-center gap-3 px-3 sm:px-5">
        <button
          type="button"
          onClick={onOpenSidebar}
          aria-label="Open navigation"
          className="rounded-lg p-2 text-ink-600 transition-colors hover:bg-paper-200 hover:text-ink-900 lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Only below `lg`: from there up the sidebar carries the brand and
            repeating it here would just take width off the search field. */}
        <Link to="/dashboard" className="flex min-w-0 shrink-0 items-center gap-2.5 lg:hidden">
          <img
            src="/logo-tile.png"
            alt=""
            width={30}
            height={30}
            className="h-[30px] w-[30px] shrink-0 rounded-lg object-cover"
          />
          {/* Hidden on the narrowest screens so the search field keeps a usable
              width rather than being squeezed between the logo and the avatar. */}
          <span className="hidden truncate font-display text-[17px] font-semibold tracking-tight text-ink-900 sm:block">
            V-Notes AI
          </span>
        </Link>

        <div className="ml-2 hidden min-w-0 flex-1 sm:flex lg:ml-0">
          <GlobalSearch />
        </div>

        <div className="ml-auto flex items-center gap-1 sm:gap-1.5">
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={
              resolvedTheme === "dark" ? "Switch to light mode" : "Switch to dark mode"
            }
            title={resolvedTheme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            className="rounded-lg p-2 text-ink-500 transition-colors hover:bg-paper-200 hover:text-ink-900"
          >
            {resolvedTheme === "dark" ? (
              <Sun className="h-[18px] w-[18px]" />
            ) : (
              <Moon className="h-[18px] w-[18px]" />
            )}
          </button>

          <NotificationsMenu />
          <UserMenu />
        </div>
      </div>

      {/* Below sm the search moves to its own row: squeezed into the bar it is
          too narrow to type into, and hiding it altogether would leave phones
          with no way to find anything. */}
      <div className="border-t border-line px-3 py-2 sm:hidden">
        <GlobalSearch />
      </div>
    </header>
  );
}
