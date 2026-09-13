import { describe, it, expect } from "vitest";
import {
  toFindingPresentation,
  toSimpleActionPresentation,
  toTopChangeHighlights,
  humanizeSeverity,
  cleanFindingTitle,
  extractStandoutValue,
} from "@/lib/analysis/presentationTransformer";
import { SAMPLE_ANALYSIS_REPORT } from "@/lib/demo/sampleAnalysis";
import { FLAGSHIP_DEMO_COMPARISON } from "@/lib/demo/compareDemoData";
import { generateDeterministicActionPlan } from "@/lib/ai/agents/actionPlanningAgent";

describe("LawPilot Presentation Simplification Layer", () => {
  it("extracts standout quantitative values from findings and financial terms", () => {
    const findingWithAmount = SAMPLE_ANALYSIS_REPORT.findings.find((f) =>
      f.title.toLowerCase().includes("training")
    );
    expect(findingWithAmount).toBeDefined();

    if (findingWithAmount) {
      const val = extractStandoutValue(findingWithAmount, SAMPLE_ANALYSIS_REPORT);
      expect(val).toBeDefined();
      expect(val).toContain("₹");
      expect(val).toContain("4,50,000");
    }
  });

  it("extracts notice period days as a standout value", () => {
    const noticeFinding = SAMPLE_ANALYSIS_REPORT.findings.find((f) =>
      f.title.toLowerCase().includes("notice")
    );
    if (noticeFinding) {
      const val = extractStandoutValue(noticeFinding, SAMPLE_ANALYSIS_REPORT);
      expect(val).toBeDefined();
      expect(val).toContain("notice");
    }
  });

  it("humanizes finding severities into high/medium/review tiers", () => {
    expect(humanizeSeverity("critical_attention").label).toBe("HIGH");
    expect(humanizeSeverity("high_attention").label).toBe("HIGH");
    expect(humanizeSeverity("review").label).toBe("MEDIUM");
    expect(humanizeSeverity("context_dependent").label).toBe("REVIEW");
  });

  it("cleans internal technical jargon prefixes from finding titles", () => {
    expect(cleanFindingTitle("Potential Financial Obligation Finding Detected: Training Reimbursement")).toBe(
      "Training Reimbursement"
    );
    expect(cleanFindingTitle("Finding: Non-Compete Scope")).toBe("Non-Compete Scope");
  });

  it("transforms sample report findings into 3-layer progressive disclosure models", () => {
    const presentation = SAMPLE_ANALYSIS_REPORT.findings.map((f) =>
      toFindingPresentation(f, SAMPLE_ANALYSIS_REPORT)
    );

    expect(presentation.length).toBe(SAMPLE_ANALYSIS_REPORT.findings.length);

    presentation.forEach((p) => {
      // Layer 1
      expect(p.id).toBeDefined();
      expect(p.title).toBeDefined();
      expect(p.summary).toBeDefined();
      expect(p.clauseReference).toBeDefined();
      expect(["HIGH", "MEDIUM", "REVIEW", "INFO"]).toContain(p.severityLabel);

      // Layer 2
      expect(p.whyWeFlagged).toBeDefined();
      expect(p.whatContractSays).toBeDefined();
      expect(p.whyItMayMatter).toBeDefined();
      expect(Array.isArray(p.whatToVerify)).toBe(true);
      expect(p.whatToVerify.length).toBeGreaterThan(0);
      expect(Array.isArray(p.whatToDoNext)).toBe(true);
      expect(p.whatToDoNext.length).toBeGreaterThan(0);

      // Jargon check: must not expose raw classification enums
      expect(p.title).not.toMatch(/DOCUMENT_FACT|LEGAL_CONTEXT|RISK_INTERPRETATION/);
    });
  });

  it("transforms action plan into clean numbered steps", () => {
    const actionPlan = generateDeterministicActionPlan({
      documentId: SAMPLE_ANALYSIS_REPORT.documentId,
      documentTitle: SAMPLE_ANALYSIS_REPORT.metadata.title,
      documentSummary: SAMPLE_ANALYSIS_REPORT.summary.keyTakeaway,
      parties: SAMPLE_ANALYSIS_REPORT.metadata.parties.map((p) => p.name),
      jurisdiction: "India",
      findings: SAMPLE_ANALYSIS_REPORT.findings,
      evidenceChains: SAMPLE_ANALYSIS_REPORT.evidenceChains,
      keyDates: SAMPLE_ANALYSIS_REPORT.keyDates,
    });

    const simpleSteps = toSimpleActionPresentation(actionPlan);
    expect(simpleSteps.length).toBeGreaterThan(0);
    expect(simpleSteps[0].number).toBe(1);
    expect(simpleSteps[0].title).toBeDefined();
    expect(simpleSteps[0].whyRecommended).toBeDefined();
  });

  it("distills comparison into top parameter change highlights", () => {
    const highlights = toTopChangeHighlights(FLAGSHIP_DEMO_COMPARISON);
    expect(highlights.length).toBeGreaterThan(0);

    const deltaStrings = highlights.map((h) => h.deltaText);
    // Should capture parameter transitions
    expect(deltaStrings.some((d) => d.includes("→") || d.includes("added"))).toBe(true);
  });
});
