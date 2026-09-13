"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useSyncExternalStore,
} from "react";

export type Theme = "light" | "dark";

export const THEME_STORAGE_KEY = "lawpilot-theme";

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
  mounted: boolean;
}

const emptySubscribe = () => () => {};

function getInitialTheme(): Theme {
  if (typeof window === "undefined") return "light";
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === "light" || stored === "dark") return stored;
    const isDomDark = document.documentElement.classList.contains("dark");
    if (isDomDark) return "dark";
    return "light";
  } catch {
    return "light";
  }
}

const ThemeContext = createContext<ThemeContextType>({
  theme: "light",
  toggleTheme: () => {},
  setTheme: () => {},
  mounted: false,
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(getInitialTheme);
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

  // Synchronize DOM on initial client mount without transition animation
  useEffect(() => {
    applyThemeToDOM(theme, false);
  }, [applyThemeToDOM, theme]);

  const setTheme = useCallback(
    (newTheme: Theme) => {
      setThemeState(newTheme);
      applyThemeToDOM(newTheme, true);
      try {
        localStorage.setItem(THEME_STORAGE_KEY, newTheme);
      } catch {
        // no-op
      }
    },
    [applyThemeToDOM]
  );

  const toggleTheme = useCallback(() => {
    const nextTheme: Theme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
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
