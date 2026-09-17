import { useEffect } from "react";

import { pinDarkSurface, unpinDarkSurface } from "../lib/theme";

/**
 * Pin the document to the dark theme while the calling route is mounted.
 *
 * The public surface of the app - the landing page and sign-in - is dark
 * regardless of the visitor's OS setting, while the signed-in app stays light.
 * Doing it per route rather than globally keeps those two apart.
 *
 * Both the class and the theme-color meta are restored on unmount, and an
 * already-present `dark` class is left alone so a future global toggle is not
 * clobbered on the way out.
 */
export function useDarkSurface(themeColor = "#080D14") {
  useEffect(() => {
    const root = document.documentElement;
    const hadDark = root.classList.contains("dark");
    root.classList.add("dark");
    // Marks the document for the duration, so an OS preference change while
    // this route is mounted cannot strip the class back off again.
    pinDarkSurface();

    // Mobile browsers tint their own chrome from this, so without it the
    // address bar stays pale above a near-black page.
    const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
    const previousThemeColor = meta?.content;
    if (meta) meta.content = themeColor;

    return () => {
      unpinDarkSurface();
      if (!hadDark) root.classList.remove("dark");
      if (meta && previousThemeColor !== undefined) meta.content = previousThemeColor;
    };
  }, [themeColor]);
}
