import { describe, it, expect } from "vitest";
import React from "react";
import { renderToString } from "react-dom/server";
import { FinalCtaScene } from "@/components/landing/FinalCtaScene";
import { UnderstandScene } from "@/components/landing/UnderstandScene";
import { VerifyScene } from "@/components/landing/VerifyScene";
import { ActScene } from "@/components/landing/ActScene";
import { CompareScene } from "@/components/landing/CompareScene";
import { Navbar } from "@/components/common/Navbar";
import { Footer } from "@/components/common/Footer";
import { DEMO_USER, getCurrentUser } from "@/lib/firebase/auth";

const FORBIDDEN_COMPETITION_TERMS = [
  "competition",
  "competition-ready",
  "hackathon",
  "promptwars",
  "judge",
  "judges",
  "judging",
  "evaluator",
  "demo-day",
  "winner",
  "scoring",
];

describe("Brand & Product Copy — Real Legal Product Verification", () => {
  it("ensures FinalCtaScene has no competition, evaluator, or hackathon language", () => {
    const html = renderToString(React.createElement(FinalCtaScene));

    for (const term of FORBIDDEN_COMPETITION_TERMS) {
      const regex = new RegExp(`\\b${term}\\b`, "i");
      expect(html).not.toMatch(regex);
    }

    // Must have real product SaaS copy
    expect(html).toContain("AI for Legal Documents");
    expect(html).toContain("Instant Analysis");
    expect(html).not.toContain("Instant Evaluation");
    expect(html).not.toContain("Competition-Ready Legal AI");
  });

  it("ensures UnderstandScene has no competition or judging language", () => {
    const html = renderToString(React.createElement(UnderstandScene));

    for (const term of FORBIDDEN_COMPETITION_TERMS) {
      const regex = new RegExp(`\\b${term}\\b`, "i");
      expect(html).not.toMatch(regex);
    }

    expect(html).toContain("See what your contract");
    expect(html).toContain("actually says.");
    expect(html).toContain("Complex clauses become clear.");
  });

  it("ensures VerifyScene, ActScene, and CompareScene have no competition wording", () => {
    const verifyHtml = renderToString(React.createElement(VerifyScene));
    const actHtml = renderToString(React.createElement(ActScene));
    const compareHtml = renderToString(React.createElement(CompareScene));

    for (const term of FORBIDDEN_COMPETITION_TERMS) {
      const regex = new RegExp(`\\b${term}\\b`, "i");
      expect(verifyHtml).not.toMatch(regex);
      expect(actHtml).not.toMatch(regex);
      expect(compareHtml).not.toMatch(regex);
    }
  });

  it("ensures Navbar and Footer present LawPilot as a standalone product", () => {
    const navHtml = renderToString(React.createElement(Navbar));
    const footerHtml = renderToString(React.createElement(Footer));

    for (const term of FORBIDDEN_COMPETITION_TERMS) {
      const regex = new RegExp(`\\b${term}\\b`, "i");
      expect(navHtml).not.toMatch(regex);
      expect(footerHtml).not.toMatch(regex);
    }

    expect(footerHtml).toContain("Sample Agreement");
    expect(footerHtml).not.toContain("India Demo");
  });

  it("ensures user auth profile defaults to professional guest context", () => {
    const user = getCurrentUser();
    expect(user.displayName).toBe("Guest User (Open Access)");
    expect(user.email).toBe("guest@lawpilot.local");
    expect(user.displayName).not.toContain("Evaluator");
    expect(user.email).not.toContain("evaluator");
    expect(DEMO_USER.displayName).toBe("Guest User (Open Access)");
  });
});
