/**
 * Theme plumbing for the light/dark toggle.
 *
 * Tailwind is configured with `darkMode: "class"`, so everything here comes
 * down to whether `dark` sits on <html>. The neutral ramps (paper, ink, line)
 * are CSS variables that swap under `html.dark`, which is what makes the
 * existing `bg-paper-50` / `text-ink-900` classes across the app follow the
 * theme without each needing a `dark:` variant of its own.
 */

export type Theme = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

export const THEME_STORAGE_KEY = "vnotes:theme";

/** Fired when one hook instance changes the theme, so any others catch up. */
export const THEME_CHANGE_EVENT = "vnotes:theme-change";

/**
 * Set to "dark" by routes that are dark whatever the user picked - the landing
 * page and sign-in. Without it, an OS preference change firing mid-visit would
 * pull the class out from under a page that depends on it.
 */
const PIN_ATTRIBUTE = "data-theme-pinned";

export function isTheme(value: unknown): value is Theme {
  return value === "light" || value === "dark" || value === "system";
}

export function readStoredTheme(): Theme {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    return isTheme(stored) ? stored : "system";
  } catch {
    // Private windows and blocked site data make storage throw on access.
    return "system";
  }
}

export function storeTheme(theme: Theme): void {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Not being able to remember the choice is not worth breaking the click.
  }
}

export function systemPrefersDark(): boolean {
  try {
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  } catch {
    return false;
  }
}

export function resolveTheme(theme: Theme): ResolvedTheme {
  if (theme === "system") return systemPrefersDark() ? "dark" : "light";
  return theme;
}

export function pinDarkSurface(): void {
  document.documentElement.setAttribute(PIN_ATTRIBUTE, "dark");
}

export function unpinDarkSurface(): void {
  document.documentElement.removeAttribute(PIN_ATTRIBUTE);
}

/**
 * Put the chosen theme on the document and report what it resolved to.
 *
 * A pinned page keeps its dark class regardless. color-scheme is set alongside
 * it so native scrollbars and form controls follow, rather than staying light
 * against a near-black page.
 */
export function applyTheme(theme: Theme): ResolvedTheme {
  const resolved = resolveTheme(theme);
  const root = document.documentElement;
  const isPinnedDark = root.getAttribute(PIN_ATTRIBUTE) === "dark";
  const shouldBeDark = resolved === "dark" || isPinnedDark;

  root.classList.toggle("dark", shouldBeDark);
  root.style.colorScheme = shouldBeDark ? "dark" : "light";

  // A pinned page owns the browser chrome colour while it is mounted.
  if (!isPinnedDark) {
    const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
    if (meta) meta.content = shouldBeDark ? "#080D14" : "#F7F9FC";
  }

  return resolved;
}
