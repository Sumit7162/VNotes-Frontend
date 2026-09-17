import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

import { AppSidebar } from "./AppSidebar";
import { TopBar } from "./TopBar";

/**
 * The signed-in application frame: a permanent sidebar from `lg` up, a sticky
 * top bar, and the page itself in the remaining space.
 *
 * The whole shell is exactly the viewport tall and only the content column
 * scrolls, so the top bar and the navigation stay put on a long page instead of
 * being carried off the top with it.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();

  // Arriving somewhere new closes the drawer; without this it stays open over
  // the page it just navigated to.
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location.pathname]);

  // While the drawer is over the page, the page behind it must not scroll.
  useEffect(() => {
    if (!isSidebarOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [isSidebarOpen]);

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-paper-100 text-ink-800 print:block print:h-auto print:overflow-visible">
      <TopBar onOpenSidebar={() => setIsSidebarOpen(true)} />

      <div className="flex min-h-0 flex-1 print:block">
        <AppSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

        {/* min-h-0 lets this flex child shrink below its content height, which
            is what allows it to scroll instead of the document. */}
        <main className="min-h-0 flex-1 overflow-y-auto print:overflow-visible print:block">
          <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8 print:max-w-none print:p-0">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
