import fs from "fs";
import path from "path";
import { describe, it, expect } from "vitest";
import { extractDocumentContent } from "@/lib/documents/textExtractor";
import { normalizeDocumentContent } from "@/lib/documents/documentNormalizer";
import { segmentDocumentIntoClauses } from "@/lib/documents/clauseSegmenter";
import { orchestrateDocumentAnalysis } from "@/lib/analysis/analysisOrchestrator";
import { FLAGSHIP_DEMO_COMPARISON } from "@/lib/demo/compareDemoData";
import { generateDeterministicActionPlan } from "@/lib/ai/agents/actionPlanningAgent";
import { generateDeterministicLawyerBrief } from "@/lib/ai/agents/lawyerBriefAgent";
import { analyzeSituation, sanitizeSituationInput } from "@/lib/ai/situation/situationEngine";
import { SAMPLE_ANALYSIS_REPORT } from "@/lib/demo/sampleAnalysis";

describe("LawPilot Critical E2E Product Audit & Data Consistency Invariants", () => {
  // ── FLOW 2 & REAL PDF REGRESSION: Upload Real PDF Fixture ──
  describe("Flow 2 & Real PDF Regression (LawPilot_Test_Employment_Agreement.pdf)", () => {
    const pdfPath = path.resolve("tests/fixtures/LawPilot_Test_Employment_Agreement.pdf");

    it("verifies the real test PDF fixture exists and has valid size", () => {
      expect(fs.existsSync(pdfPath)).toBe(true);
      const stat = fs.statSync(pdfPath);
      expect(stat.size).toBeGreaterThan(10000);
      expect(stat.size).toBeLessThan(15 * 1024 * 1024);
    });

    it("parses the real employment agreement into structured clauses with valid page references", async () => {
      const buffer = fs.readFileSync(pdfPath);
      const extracted = await extractDocumentContent(buffer, "pdf");
      const normalized = normalizeDocumentContent(extracted.rawText, extracted.pages);
      const clauses = segmentDocumentIntoClauses(normalized.normalizedFullText, extracted.pages, "doc-test-1");

      expect(normalized.normalizedFullText.length).toBeGreaterThan(500);
      expect(clauses.length).toBeGreaterThanOrEqual(10);
      expect(extracted.totalPageCount).toBeGreaterThanOrEqual(2);

      // Verify every clause has a non-empty section, title, and valid page number
      for (const clause of clauses) {
        expect(clause.title).toBeTruthy();
        expect(clause.section).toBeTruthy();
        if (clause.pageNumber !== undefined && clause.pageNumber !== null) {
          expect(clause.pageNumber).toBeGreaterThan(0);
          expect(clause.pageNumber).toBeLessThanOrEqual(extracted.totalPageCount);
        }
      }
    });

    it("executes multi-agent analysis on real PDF and generates consistent findings & evidence chains", async () => {
      const buffer = fs.readFileSync(pdfPath);
      const report = await orchestrateDocumentAnalysis(buffer, "LawPilot_Test_Employment_Agreement.pdf");

      expect(report.documentId).toBeTruthy();
      expect(report.findings.length).toBeGreaterThanOrEqual(3);
      expect(report.findings.length).toBeLessThanOrEqual(10);

      // Verify Section 8 Finding Consistency Invariant:
      // For every finding, Title, Severity, Clause, Page, and Evidence must agree
      for (const finding of report.findings) {
        expect(finding.title).toBeTruthy();
        expect(["critical_attention", "high_attention", "review", "informational"]).toContain(finding.severity);

        // Find associated clause
        const associatedClause = report.clauses.find((c) => c.id === finding.clauseId);
        if (associatedClause) {
          expect(associatedClause.title).toBeTruthy();
          expect(associatedClause.section).toBeTruthy();
          if (associatedClause.pageNumber && finding.evidence?.pageNumber) {
            expect(finding.evidence.pageNumber).toBe(associatedClause.pageNumber);
          }
        }
        expect(finding.evidence?.section).toBeTruthy();
        expect(finding.evidence?.quotedText).toBeTruthy();

        // Verify evidence chain if present
        const chain = report.evidenceChains?.find((c) => c.finding?.id === finding.id);
        if (chain) {
          if (chain.verification.status === "insufficient_context") {
            // Honest "no curated authority for this topic": must not carry any source.
            expect(chain.legalSources).toHaveLength(0);
          } else {
            expect(chain.legalClaims.length).toBeGreaterThan(0);
            expect(chain.legalSources.length).toBeGreaterThan(0);
            // Verify citation is non-empty and verified
            expect(chain.legalSources[0].citation).toBeTruthy();
            expect(chain.legalSources[0].verificationStatus).toBe("verified");
          }
        }
      }
    }, 30000);
  });

  // ── FLOW 5: Flagship Compare E2E Invariants ──
  describe("Flow 5: Flagship Document Compare Consistency Invariants", () => {
    it("guarantees exactly 5 material changes in summary and topMaterialChanges collection", () => {
      const comp = FLAGSHIP_DEMO_COMPARISON;
      expect(comp.summary.materialChangesCount).toBe(5);
      expect(comp.topMaterialChanges).toHaveLength(5);
    });

    it("guarantees exact alignment between summary changed count and change items", () => {
      const comp = FLAGSHIP_DEMO_COMPARISON;
      const modifiedCount = comp.changes.filter((c) => c.changeType === "MODIFIED").length;
      const addedCount = comp.changes.filter((c) => c.changeType === "ADDED").length;
      const removedCount = comp.changes.filter((c) => c.changeType === "REMOVED").length;

      expect(comp.summary.clausesChanged).toBe(modifiedCount);
      expect(comp.summary.clausesAdded).toBe(addedCount);
      expect(comp.summary.clausesRemoved).toBe(removedCount);

      // 7 modified, 1 added, 0 removed = 8 total changes
      expect(modifiedCount).toBe(7);
      expect(addedCount).toBe(1);
      expect(removedCount).toBe(0);
    });

    it("links statutory authorities for Indian jurisdiction changes", () => {
      const comp = FLAGSHIP_DEMO_COMPARISON;
      const bondChange = comp.changes.find((c) => c.clauseTitle.includes("Training"));
      expect(bondChange).toBeDefined();
      expect(bondChange?.evidenceChain?.legalSources[0].citation).toContain("Indian Contract Act, 1872 § 74");

      const ncChange = comp.changes.find((c) => c.clauseTitle.includes("Non-Compete"));
      expect(ncChange).toBeDefined();
      expect(ncChange?.evidenceChain?.legalSources[0].citation).toContain("Indian Contract Act, 1872 § 27");

      const arbChange = comp.changes.find((c) => c.clauseTitle.includes("Arbitrat"));
      expect(arbChange).toBeDefined();
      expect(arbChange?.evidenceChain?.legalSources[0].citation).toContain("Arbitration and Conciliation Act, 1996 § 12(5)");
    });
  });

  // ── FLOW 6: Situation Navigator E2E Invariants ──
  describe("Flow 6: Situation Navigator Fact Extraction & Legal Routing", () => {
    it("handles vague/short scenario ('I am sick') without inventing fabricated claims", async () => {
      const assessment = await analyzeSituation("I am sick");
      expect(assessment).toBeDefined();
      expect(assessment.identifiedCategory).toBe("insufficient_information");
      expect(assessment.disclaimer).toBeTruthy();
      expect(assessment.possibleOptions.length).toBeGreaterThan(0);
      expect(assessment.actionChecklist.length).toBeGreaterThan(0);
      expect(assessment.followUpQuestions.length).toBeGreaterThan(0);
    });

    it("handles unpaid invoice scenario with calibrated debt recovery avenues", async () => {
      const scenario =
        "A client in Mumbai approved my deliverables 60 days ago but has not paid an invoice of INR 2,50,000 despite multiple reminders.";
      const assessment = await analyzeSituation(scenario);

      expect(assessment.identifiedCategory).toBe("freelance_unpaid_invoice");
      expect(assessment.possibleOptions.length).toBeGreaterThan(0);

      // Verify legal route references
      const optionTitles = assessment.possibleOptions.map((o) => o.title.toLowerCase());
      const hasDemandOrRecovery = optionTitles.some(
        (t) => t.includes("notice") || t.includes("demand") || t.includes("msme") || t.includes("suit") || t.includes("payment")
      );
      expect(hasDemandOrRecovery).toBe(true);
    });

    it("rejects empty or whitespace-only scenario input with user-friendly validation error", () => {
      const emptyResult = sanitizeSituationInput("");
      expect(emptyResult.valid).toBe(false);
      expect(emptyResult.error).toContain("Describe what happened");

      const whitespaceResult = sanitizeSituationInput("   ");
      expect(whitespaceResult.valid).toBe(false);
      expect(whitespaceResult.error).toContain("Describe what happened");
    });
  });

  // ── FLOW 7 & 8: Action Plan & Lawyer Brief Invariants ──
  describe("Flow 7 & 8: Action Plan & Lawyer Brief Invariants", () => {
    it("generates deterministic Action Plan with 100% unique IDs across all items", () => {
      const plan = generateDeterministicActionPlan({
        documentId: SAMPLE_ANALYSIS_REPORT.documentId,
        documentTitle: SAMPLE_ANALYSIS_REPORT.metadata.title,
        documentSummary: SAMPLE_ANALYSIS_REPORT.summary.keyTakeaway,
        parties: SAMPLE_ANALYSIS_REPORT.metadata.parties.map((p) => p.name),
        jurisdiction: SAMPLE_ANALYSIS_REPORT.metadata.jurisdiction || undefined,
        findings: SAMPLE_ANALYSIS_REPORT.findings,
        evidenceChains: SAMPLE_ANALYSIS_REPORT.evidenceChains,
        keyDates: SAMPLE_ANALYSIS_REPORT.keyDates,
      });

      const allItems = [
        ...plan.urgentItems,
        ...plan.beforeSigning,
        ...plan.questionsToAsk,
        ...plan.documentsToCollect,
        ...plan.factsToConfirm,
        ...plan.followUpItems,
      ];

      expect(allItems.length).toBeGreaterThanOrEqual(3);
      const ids = allItems.map((item) => item.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);

      // Every action item must have title, explanation, and practicalAdvice
      for (const item of allItems) {
        expect(item.title).toBeTruthy();
        expect(item.explanation).toBeTruthy();
        expect(item.practicalAdvice).toBeTruthy();
      }
    });

    it("generates comprehensive Lawyer Brief reflecting current findings and questions", () => {
      const brief = generateDeterministicLawyerBrief({
        documentId: SAMPLE_ANALYSIS_REPORT.documentId,
        documentTitle: SAMPLE_ANALYSIS_REPORT.metadata.title,
        documentType: SAMPLE_ANALYSIS_REPORT.metadata.documentType || "Agreement",
        documentSummary: SAMPLE_ANALYSIS_REPORT.summary.keyTakeaway,
        parties: SAMPLE_ANALYSIS_REPORT.metadata.parties.map((p) => p.name),
        jurisdiction: SAMPLE_ANALYSIS_REPORT.metadata.jurisdiction || undefined,
        findings: SAMPLE_ANALYSIS_REPORT.findings,
        clauses: SAMPLE_ANALYSIS_REPORT.clauses,
        evidenceChains: SAMPLE_ANALYSIS_REPORT.evidenceChains,
        keyDates: SAMPLE_ANALYSIS_REPORT.keyDates,
      });

      expect(brief.document.title).toBe(SAMPLE_ANALYSIS_REPORT.metadata.title);
      expect(brief.userConcerns.length).toBe(SAMPLE_ANALYSIS_REPORT.findings.length);
      expect(brief.questionsForCounsel.length).toBeGreaterThan(0);
      expect(brief.disclaimer).toBeTruthy();
    });
  });
});
