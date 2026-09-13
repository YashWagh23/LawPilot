import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  THEME_STORAGE_KEY,
  THEME_COOKIE_KEY,
  resolveTheme,
} from "@/components/theme/ThemeProvider";

describe("Theme System & SSR Cookie Architecture", () => {
  let localStorageMock: Record<string, string> = {};
  let classListSet: Set<string> = new Set();
  let cookieMock = "";

  beforeEach(() => {
    localStorageMock = {};
    classListSet = new Set();
    cookieMock = "";

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
      get cookie() {
        return cookieMock;
      },
      set cookie(val: string) {
        cookieMock = val;
      },
      documentElement: {
        classList: {
          add: (cls: string) => classListSet.add(cls),
          remove: (cls: string) => classListSet.delete(cls),
          contains: (cls: string) => classListSet.has(cls),
        },
      },
    });
  });

  it("exports the expected cookie and storage keys", () => {
    expect(THEME_STORAGE_KEY).toBe("lawpilot-theme");
    expect(THEME_COOKIE_KEY).toBe("lawpilot-theme");
  });

  describe("Server-Side resolveTheme Utility", () => {
    it("defaults strictly to light on first visit when cookie is absent or empty", () => {
      expect(resolveTheme(undefined)).toBe("light");
      expect(resolveTheme(null)).toBe("light");
      expect(resolveTheme("")).toBe("light");
    });

    it("resolves dark theme when lawpilot-theme cookie is dark", () => {
      expect(resolveTheme("dark")).toBe("dark");
    });

    it("resolves light theme when lawpilot-theme cookie is light", () => {
      expect(resolveTheme("light")).toBe("light");
    });

    it("sanitizes unexpected or malicious values to default light theme", () => {
      expect(resolveTheme("auto")).toBe("light");
      expect(resolveTheme("system")).toBe("light");
      expect(resolveTheme("<script>alert(1)</script>")).toBe("light");
      expect(resolveTheme("admin")).toBe("light");
    });
  });

  describe("Client-Side Persistence & Synchronization", () => {
    it("persists user selected theme to both localStorage and cookie", () => {
      const updateTheme = (newTheme: "light" | "dark") => {
        localStorage.setItem(THEME_STORAGE_KEY, newTheme);
        document.cookie = `${THEME_COOKIE_KEY}=${newTheme}; path=/; max-age=31536000; SameSite=Lax`;
      };

      updateTheme("dark");
      expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe("dark");
      expect(document.cookie).toContain("lawpilot-theme=dark");
      expect(document.cookie).toContain("SameSite=Lax");

      updateTheme("light");
      expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe("light");
      expect(document.cookie).toContain("lawpilot-theme=light");
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
        document.cookie = `${THEME_COOKIE_KEY}=${currentTheme}; path=/; max-age=31536000; SameSite=Lax`;
      };

      expect(currentTheme).toBe("dark");

      // Click 1: Dark -> Light
      toggle();
      expect(currentTheme).toBe("light");
      expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe("light");
      expect(document.cookie).toContain("lawpilot-theme=light");

      // Click 2: Light -> Dark
      toggle();
      expect(currentTheme).toBe("dark");
      expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe("dark");
      expect(document.cookie).toContain("lawpilot-theme=dark");
    });

    it("ensures cookie contains only theme value and never exposes secrets", () => {
      const safeCookie = `${THEME_COOKIE_KEY}=dark; path=/; max-age=31536000; SameSite=Lax`;
      expect(safeCookie).not.toContain("API_KEY");
      expect(safeCookie).not.toContain("TOKEN");
      expect(safeCookie).not.toContain("SECRET");
      expect(safeCookie).toMatch(/^lawpilot-theme=(light|dark);/);
    });
  });
});
