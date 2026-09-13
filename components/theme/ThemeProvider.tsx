"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useSyncExternalStore,
} from "react";

export type { Theme } from "@/lib/theme";
export {
  THEME_STORAGE_KEY,
  THEME_COOKIE_KEY,
  resolveTheme,
} from "@/lib/theme";
import type { Theme } from "@/lib/theme";
import {
  THEME_STORAGE_KEY,
  THEME_COOKIE_KEY,
} from "@/lib/theme";

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
  mounted: boolean;
}

const emptySubscribe = () => () => {};

const ThemeContext = createContext<ThemeContextType>({
  theme: "light",
  toggleTheme: () => {},
  setTheme: () => {},
  mounted: false,
});

export function ThemeProvider({
  children,
  initialTheme = "light",
}: {
  children: React.ReactNode;
  initialTheme?: Theme;
}) {
  const [theme, setThemeState] = useState<Theme>(initialTheme);
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  // Helper to apply classes and transitions to the document root
  const applyThemeToDOM = useCallback((newTheme: Theme, animate = true) => {
    if (typeof document === "undefined") return;

    const root = document.documentElement;

    if (animate) {
      root.classList.add("theme-transitioning");
    }

    if (newTheme === "dark") {
      root.classList.add("dark");
      root.classList.remove("light");
    } else {
      root.classList.remove("dark");
      root.classList.add("light");
    }

    if (animate) {
      window.setTimeout(() => {
        root.classList.remove("theme-transitioning");
      }, 260);
    }
  }, []);

  const persistTheme = useCallback((newTheme: Theme) => {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, newTheme);
    } catch {
      // no-op
    }
    try {
      document.cookie = `${THEME_COOKIE_KEY}=${newTheme}; path=/; max-age=31536000; SameSite=Lax`;
    } catch {
      // no-op
    }
  }, []);

  const setTheme = useCallback(
    (newTheme: Theme) => {
      setThemeState(newTheme);
      applyThemeToDOM(newTheme, true);
      persistTheme(newTheme);
    },
    [applyThemeToDOM, persistTheme]
  );

  const toggleTheme = useCallback(() => {
    const nextTheme: Theme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
  }, [theme, setTheme]);

  // After mount, verify if localStorage has a preference that differs from cookie
  useEffect(() => {
    try {
      const stored = localStorage.getItem(THEME_STORAGE_KEY);
      if (stored === "dark" || stored === "light") {
        if (stored !== theme) {
          requestAnimationFrame(() => {
            setTheme(stored);
          });
          return;
        }
      }
      localStorage.setItem(THEME_STORAGE_KEY, theme);
      document.cookie = `${THEME_COOKIE_KEY}=${theme}; path=/; max-age=31536000; SameSite=Lax`;
    } catch {
      // no-op
    }
  }, [theme, setTheme]);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme, mounted }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
