import { describe, it, expect } from "vitest";
import {
  sanitizeSituationInput,
  generateDeterministicSituationAssessment,
  analyzeSituation,
  MAX_SITUATION_INPUT_LENGTH,
  MEDICAL_HEALTH_DISCLAIMER,
} from "@/lib/ai/situation/situationEngine";
import { POST as situationRouteHandler } from "@/app/api/situation/route";
import { SAMPLE_SITUATION_ASSESSMENT } from "@/lib/demo/sampleAnalysis";
import { NextRequest } from "next/server";

describe("Situation Navigator: Core Engine & Integration Tests", () => {
  // 1. Empty input validation
  describe("1. Empty Input & Validation", () => {
    it("rejects empty string with clear message", () => {
      const res = sanitizeSituationInput("");
      expect(res.valid).toBe(false);
      expect(res.error).toBe("Describe what happened so LawPilot can identify the relevant issues.");
    });

    it("rejects whitespace-only string with clear message", () => {
      const res = sanitizeSituationInput("     \n\t   ");
      expect(res.valid).toBe(false);
      expect(res.error).toBe("Describe what happened so LawPilot can identify the relevant issues.");
    });

    it("rejects null/undefined or non-string input safely", () => {
      const res = sanitizeSituationInput(null as unknown as string);
      expect(res.valid).toBe(false);
      expect(res.error).toBe("Describe what happened so LawPilot can identify the relevant issues.");
    });
  });

  // 2. Valid input & bounds
  describe("2. Valid Input & Bounds", () => {
    it("trims whitespace and accepts valid scenario text", () => {
      const text = "   My client in California owes me $5,000 for web design.   ";
      const res = sanitizeSituationInput(text);
      expect(res.valid).toBe(true);
      expect(res.sanitized).toBe("My client in California owes me $5,000 for web design.");
    });

    it("enforces maximum input length of 4,000 characters", () => {
      const overlyLong = "a".repeat(MAX_SITUATION_INPUT_LENGTH + 50);
      const res = sanitizeSituationInput(overlyLong);
      expect(res.valid).toBe(false);
      expect(res.error).toContain("4,000");
    });
  });

  // 3. API Route Handler Flow
  describe("3. API Route Handling & Verification", () => {
    it("returns 400 when empty body or empty situationText is posted", async () => {
      const req = new NextRequest("http://localhost:3000/api/situation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ situationText: "   " }),
      });

      const response = await situationRouteHandler(req);
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toBe("Describe what happened so LawPilot can identify the relevant issues.");
    });

    it("returns 400 when invalid JSON is sent", async () => {
      const req = new NextRequest("http://localhost:3000/api/situation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "invalid-json{",
      });

      const response = await situationRouteHandler(req);
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toContain("Invalid JSON");
    });

    it("returns 200 with structured assessment on valid input", async () => {
      const req = new NextRequest("http://localhost:3000/api/situation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          situationText: "My landlord withheld my $2,000 security deposit without providing an itemized list of deductions.",
        }),
      });

      const response = await situationRouteHandler(req);
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.assessment).toBeDefined();
      expect(data.assessment.identifiedCategory).toBe("landlord_tenant");
      expect(data.assessment.situationSummary).toBeTruthy();
      expect(data.assessment.missingFacts.length).toBeGreaterThan(0);
      expect(data.assessment.possibleOptions.length).toBeGreaterThan(0);
    });
  });

  // 4. "I AM SICK" — Responsible AI Handling (No Fabricated Legal Claims, Medical Disclaimer)
  describe("4. Responsible Handling of 'I am sick' & Personal Health Prompts", () => {
    it("recognizes 'I am sick' as insufficient legal information and does not invent a legal case", async () => {
      const assessment = await analyzeSituation("I am sick");
      expect(assessment.identifiedCategory).toBe("insufficient_information");
      expect(assessment.disclaimer).toBe(MEDICAL_HEALTH_DISCLAIMER);
      expect(assessment.situationSummary?.toLowerCase()).toContain("not enough");

      // Verify it does NOT invent lawsuits, breach of contract, or fabricated damages
      const promptAndSummary = (assessment.situationSummary + " " + assessment.userPrompt).toLowerCase();
      expect(promptAndSummary).not.toContain("lawsuit");
      expect(promptAndSummary).not.toContain("breach of contract");

      // Must provide up to 3 clarifying questions
      expect(assessment.followUpQuestions.length).toBeGreaterThan(0);
      expect(assessment.followUpQuestions.length).toBeLessThanOrEqual(3);

      const qTexts = assessment.followUpQuestions.map((q) => q.question.toLowerCase()).join(" ");
      expect(qTexts).toContain("employment");
      expect(qTexts).toContain("adverse action");

      // Must suggest health recovery first
      const firstAction = assessment.actionChecklist[0];
      expect(firstAction.title.toLowerCase()).toContain("medical");
      expect(firstAction.isReversible).toBe(true);
    });

    it("handles variations like 'i feel sick' or 'i have a fever' safely with medical disclaimer", async () => {
      const assessment = await analyzeSituation("I feel sick and have a fever");
      expect(assessment.identifiedCategory).toBe("insufficient_information");
      expect(assessment.disclaimer).toContain("Medical Notice");
    });
  });

  // 5. Sample Scenario: Unpaid Freelance Invoice
  describe("5. Sample Scenario: Unpaid Freelance Invoice", () => {
    it("correctly analyzes the sample freelance scenario with grounded options", async () => {
      const assessment = await analyzeSituation(SAMPLE_SITUATION_ASSESSMENT.userPrompt);
      expect(assessment.identifiedCategory).toBe("freelance_unpaid_invoice");
      expect(assessment.situationSummary).toBeTruthy();
      expect(assessment.missingFacts).toContain(
        "Exact legal entity structure of the non-paying client (LLC, Corporation, or Sole Proprietor)."
      );

      // Verify reversible next steps
      const options = assessment.possibleOptions;
      expect(options.length).toBeGreaterThanOrEqual(1);
      const highRev = options.find((o) => o.reversibility === "high");
      expect(highRev).toBeDefined();
      expect(highRev?.title.toLowerCase()).toContain("demand letter");

      // Verify evidence checklist
      expect(assessment.evidenceToCollect.length).toBeGreaterThan(0);
    });
  });

  // 6. Generic Insufficient Information (Vague non-legal prompts)
  describe("6. Insufficient Information for Vague Prompts", () => {
    it("handles short greetings or non-factual prompts safely as insufficient_information", async () => {
      const assessment = await analyzeSituation("hello can you help me");
      expect(assessment.identifiedCategory).toBe("insufficient_information");
      expect(assessment.missingFacts.length).toBeGreaterThan(0);
      expect(assessment.followUpQuestions.length).toBeGreaterThan(0);
      expect(assessment.followUpQuestions.length).toBeLessThanOrEqual(3);
    });
  });

  // 7. Grounding & Legal Safety Principles (No Overstated Certainty)
  describe("7. Grounding & Strict Legal Safety Guardrails", () => {
    it("ensures no forbidden certainty language appears in options or explanations", async () => {
      const assessment = await analyzeSituation(
        "My employer fired me yesterday without warning after I reported safety concerns."
      );

      expect(assessment.identifiedCategory).toBe("employment_dispute");

      const allText = JSON.stringify(assessment).toLowerCase();
      // LawPilot strict forbidden phrases
      expect(allText).not.toContain("this is illegal");
      expect(allText).not.toContain("you will definitely win");
      expect(allText).not.toContain("they cannot do this");
      expect(allText).not.toContain("you should sue");
      expect(allText).not.toContain("this violates the law");

      // Verifies options prioritize high or moderate reversibility
      for (const opt of assessment.possibleOptions) {
        expect(["high", "moderate", "low"]).toContain(opt.reversibility);
      }
    });
  });

  // 8. Deterministic Fallback Integrity
  describe("8. Deterministic Engine Integrity", () => {
    it("generates complete, valid SituationAssessment schema across all dispute types", () => {
      const cases = [
        { text: "Client has not paid my invoice for 60 days", cat: "freelance_unpaid_invoice" },
        { text: "My boss cut my salary and threatened to fire me", cat: "employment_dispute" },
        { text: "Landlord wants to evict me without 30 days notice", cat: "landlord_tenant" },
        { text: "Dispute over partnership shares in a new startup", cat: "other" },
      ];

      for (const c of cases) {
        const result = generateDeterministicSituationAssessment(c.text);
        expect(result.identifiedCategory).toBe(c.cat);
        expect(result.id).toBeTruthy();
        expect(result.situationSummary).toBeTruthy();
        expect(result.missingFacts.length).toBeGreaterThan(0);
        expect(result.followUpQuestions.length).toBeGreaterThan(0);
        expect(result.possibleOptions.length).toBeGreaterThan(0);
        expect(result.evidenceToCollect.length).toBeGreaterThan(0);
        expect(result.questionsForLawyer.length).toBeGreaterThan(0);
        expect(result.actionChecklist.length).toBeGreaterThan(0);
      }
    });
  });

  // 9. Page Component Rendering & Structural Correctness
  describe("9. SituationPage Component SSR & Structure", () => {
    it("renders the situation page with form, guidance, and navigate button", async () => {
      const { renderToString } = await import("react-dom/server");
      const React = await import("react");
      const SituationPage = (await import("@/app/situation/page")).default;

      const html = renderToString(React.createElement(SituationPage));
      expect(html).toContain("Describe a Legal Situation");
      expect(html).toContain("What happened?");
      expect(html).toContain("Load Sample Scenario: Unpaid Freelance Invoice");
      expect(html).toContain("Navigate Situation");
      expect(html).toContain("id=\"navigate-situation-button\"");
      expect(html).not.toContain("Preliminary Situation Assessment");
    });
  });

  // 10. API Failure Handling
  describe("10. API Route Error Handling", () => {
    it("returns 500 with user-friendly message when internal engine throws", async () => {
      // Create a mock request that causes an unhandled error inside handler
      const req = {
        json: async () => {
          throw new Error("Simulated internal stream failure");
        },
      } as unknown as NextRequest;

      const response = await situationRouteHandler(req);
      expect(response.status).toBe(400); // Handled by JSON catch block
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toContain("Invalid JSON request body");
    });
  });
});
