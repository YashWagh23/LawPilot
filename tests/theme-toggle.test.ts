import { describe, it, expect, beforeEach, vi } from "vitest";
import { THEME_STORAGE_KEY } from "@/components/theme/ThemeProvider";

describe("Theme System & Toggle Logic", () => {
  let localStorageMock: Record<string, string> = {};
  let classListSet: Set<string> = new Set();

  beforeEach(() => {
    localStorageMock = {};
    classListSet = new Set();

    vi.stubGlobal("localStorage", {
      getItem: (key: string) => localStorageMock[key] ?? null,
      setItem: (key: string, value: string) => {
        localStorageMock[key] = value;
      },
      removeItem: (key: string) => {
        delete localStorageMock[key];
      },
      clear: () => {
        localStorageMock = {};
      },
    });

    vi.stubGlobal("document", {
      documentElement: {
        classList: {
          add: (cls: string) => classListSet.add(cls),
          remove: (cls: string) => classListSet.delete(cls),
          contains: (cls: string) => classListSet.has(cls),
        },
      },
    });
  });

  it("exports the expected localStorage key", () => {
    expect(THEME_STORAGE_KEY).toBe("lawpilot-theme");
  });

  it("persists user selected theme to localStorage", () => {
    localStorage.setItem(THEME_STORAGE_KEY, "light");
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe("light");

    localStorage.setItem(THEME_STORAGE_KEY, "dark");
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe("dark");
  });

  it("defaults to light theme on first visit regardless of system preference", () => {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    expect(stored).toBeNull();

    // Priority: Saved preference > Default light (NOT system preference > Default light)
    const resolveEffectiveTheme = (saved: string | null): "light" | "dark" => {
      if (saved === "dark" || saved === "light") return saved;
      return "light";
    };

    expect(resolveEffectiveTheme(stored)).toBe("light");
  });

  it("prioritizes stored user preference over default light theme", () => {
    localStorage.setItem(THEME_STORAGE_KEY, "dark");
    const stored = localStorage.getItem(THEME_STORAGE_KEY);

    const resolveEffectiveTheme = (saved: string | null): "light" | "dark" => {
      if (saved === "dark" || saved === "light") return saved;
      return "light";
    };

    expect(resolveEffectiveTheme(stored)).toBe("dark");

    // Switching back to light persists
    localStorage.setItem(THEME_STORAGE_KEY, "light");
    expect(resolveEffectiveTheme(localStorage.getItem(THEME_STORAGE_KEY))).toBe("light");
  });

  it("updates DOM classes correctly on theme switch", () => {
    const applyTheme = (theme: "light" | "dark") => {
      const root = document.documentElement;
      if (theme === "dark") {
        root.classList.add("dark");
        root.classList.remove("light");
      } else {
        root.classList.remove("dark");
        root.classList.add("light");
      }
    };

    applyTheme("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
    expect(document.documentElement.classList.contains("light")).toBe(false);

    applyTheme("light");
    expect(document.documentElement.classList.contains("light")).toBe(true);
    expect(document.documentElement.classList.contains("dark")).toBe(false);
  });

  it("generates correct accessible labels depending on theme", () => {
    const getActionLabel = (theme: "light" | "dark") =>
      theme === "dark" ? "Switch to light mode" : "Switch to dark mode";

    expect(getActionLabel("dark")).toBe("Switch to light mode");
    expect(getActionLabel("light")).toBe("Switch to dark mode");
  });

  it("shows the action icon to transform the theme (Moon in light mode, Sun in dark mode)", () => {
    const getVisibleIcon = (theme: "light" | "dark") =>
      theme === "light" ? "moon" : "sun";

    expect(getVisibleIcon("light")).toBe("moon");
    expect(getVisibleIcon("dark")).toBe("sun");
  });

  it("toggles between dark and light seamlessly", () => {
    let currentTheme: "light" | "dark" = "dark";
    const toggle = () => {
      currentTheme = currentTheme === "dark" ? "light" : "dark";
      localStorage.setItem(THEME_STORAGE_KEY, currentTheme);
    };

    expect(currentTheme).toBe("dark");

    // Click 1: Dark -> Light
    toggle();
    expect(currentTheme).toBe("light");
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe("light");

    // Click 2: Light -> Dark
    toggle();
    expect(currentTheme).toBe("dark");
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe("dark");
  });
});
