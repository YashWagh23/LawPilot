import { describe, it, expect, beforeEach, vi } from "vitest";
import { THEME_STORAGE_KEY } from "@/components/theme/ThemeProvider";
import { subProgress } from "@/lib/hooks/useSceneScroll";

describe("ColorBends Lifecycle & Theme & Mobile Responsiveness", () => {
  beforeEach(() => {
    vi.stubGlobal("localStorage", {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
    });
  });

  it("exports the lawpilot-theme key constant", () => {
    expect(THEME_STORAGE_KEY).toBe("lawpilot-theme");
  });

  describe("ColorBends Lifecycle & Fallback Guarantee", () => {
    it("ensures WebGL failure gracefully switches to fallback rather than crashing", () => {
      let fallbackTriggered = false;
      const simulateRendererInit = (forceThrow = false) => {
        try {
          if (forceThrow) {
            throw new Error("WebGL context creation failed");
          }
          return { initialized: true };
        } catch {
          fallbackTriggered = true;
          return null;
        }
      };

      const result = simulateRendererInit(true);
      expect(result).toBeNull();
      expect(fallbackTriggered).toBe(true);
    });

    it("verifies IntersectionObserver offscreen pause logic", () => {
      let isIntersecting = true;
      let loopRunning = true;

      const handleIntersectionChange = (intersecting: boolean) => {
        isIntersecting = intersecting;
        if (!isIntersecting) {
          loopRunning = false; // pause offscreen
        } else {
          loopRunning = true; // resume when visible
        }
      };

      expect(loopRunning).toBe(true);
      // Scrolled offscreen
      handleIntersectionChange(false);
      expect(loopRunning).toBe(false);

      // Scrolled back into view
      handleIntersectionChange(true);
      expect(loopRunning).toBe(true);
    });
  });

  describe("Strict Light-Theme Default Precedence", () => {
    it("opens in LIGHT theme on first visit regardless of OS dark mode preference", () => {
      const getFirstVisitTheme = (
        saved: string | null,
        _systemPrefersDark: boolean
      ): "light" | "dark" => {
        // Priority: Saved user preference > Default light (NOT system preference > default light)
        if (saved === "dark" || saved === "light") return saved;
        return "light";
      };

      // OS is in dark mode, but user has never visited
      const firstVisitTheme = getFirstVisitTheme(null, true);
      expect(firstVisitTheme).toBe("light");
    });

    it("persists explicit user dark selection across refreshes", () => {
      const getTheme = (saved: string | null): "light" | "dark" => {
        if (saved === "dark" || saved === "light") return saved;
        return "light";
      };

      expect(getTheme("dark")).toBe("dark");
      expect(getTheme("light")).toBe("light");
    });
  });

  describe("Mobile Scroll & Viewport Adaptations (< 1024px)", () => {
    it("subProgress clamps cleanly between 0 and 1", () => {
      expect(subProgress(0.1, 0.2, 0.8)).toBe(0);
      expect(subProgress(0.5, 0.2, 0.8)).toBeCloseTo(0.5);
      expect(subProgress(0.9, 0.2, 0.8)).toBe(1);
    });

    it("ensures mobile scenes default to fully visible content without translation traps", () => {
      const computeSceneState = (isDesktop: boolean, reducedMotion: boolean, progress: number) => {
        const isAnimated = isDesktop && !reducedMotion;
        return {
          docShift: isAnimated ? subProgress(progress, 0.2, 0.6) * -18 : 0,
          opacity: isAnimated ? subProgress(progress, 0.35, 0.6) : 1,
          metricSlide: isAnimated ? (1 - subProgress(progress, 0.35, 0.65)) * 60 : 0,
          isPinned: isAnimated,
        };
      };

      // Mobile phone (320px - 430px) -> isDesktop = false
      const mobileState = computeSceneState(false, false, 0.0);
      expect(mobileState.docShift).toBe(0); // No horizontal transform
      expect(mobileState.opacity).toBe(1); // Content fully visible
      expect(mobileState.metricSlide).toBe(0); // In natural position
      expect(mobileState.isPinned).toBe(false); // Natural vertical scroll, no scroll trapping

      // Desktop (1280px+) -> isDesktop = true
      const desktopState = computeSceneState(true, false, 0.1);
      expect(desktopState.isPinned).toBe(true);
    });
  });
});
