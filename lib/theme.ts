export type Theme = "light" | "dark";

export const THEME_COOKIE_KEY = "lawpilot-theme";
export const THEME_STORAGE_KEY = "lawpilot-theme";

/**
 * Server-safe and client-safe theme resolution.
 * Defaults strictly to "light" theme on first-ever visit (no cookie, no stored preference).
 * System dark mode does NOT override this default.
 * Sanitizes any invalid or unexpected values to "light".
 */
export function resolveTheme(themeValue?: string | null): Theme {
  return themeValue === "dark" ? "dark" : "light";
}
