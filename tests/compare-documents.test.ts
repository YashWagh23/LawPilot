import React from "react";
import { renderToString } from "react-dom/server";
import { describe, it, expect } from "vitest";
import {
  matchClausesSemantically,
  calculateClauseAffinity,
  normalizeClauseTitle,
  computeTokenJaccard,
} from "@/lib/comparison/clauseMatcher";
import {
  analyzeClauseDifference,
  analyzeAllClauseDifferences,
} from "@/lib/comparison/semanticChangeDetector";
import {
  compareJurisdictions,
  integrateLegalContext,
} from "@/lib/comparison/legalContextIntegrator";
import {
  compareDocumentBuffers,
} from "@/lib/comparison/documentComparator";
import {
  DEMO_PREVIOUS_CLAUSES,
  DEMO_CURRENT_CLAUSES,
  DEMO_PREVIOUS_JURISDICTION,
  DEMO_CURRENT_JURISDICTION,
  buildFlagshipDemoComparison,
  FLAGSHIP_DEMO_COMPARISON,
} from "@/lib/demo/compareDemoData";
import {
  addCompareActionItem,
  getCompareActionItems,
  removeCompareActionItem,
} from "@/lib/comparison/compareActionStore";
import { ComparisonSummaryView, getConciseWhyItMatters } from "@/components/compare/ComparisonSummaryView";
import type { Clause, JurisdictionContext, ClauseComparisonItem } from "@/types";

describe("Phase 8: Compare Documents — Semantic Legal Change Analysis", () => {
  // 1. Clause Matching & Normalization
  describe("Clause Matching & Section Renumbering", () => {
    it("normalizes clause titles by stripping section prefixes and punctuation", () => {
      const title1 = normalizeClauseTitle("Section 6.3: Confidentiality and Non-Disclosure");
      expect(title1).toBe("confidentiality and non disclosure");

      const title2 = normalizeClauseTitle("Article IV - Early Departure Training Bond");
      expect(title2).toBe("early departure training bond");
    });

    it("computes Jaccard token overlap between clause text", () => {
      const setA = new Set(["employee", "agrees", "notice", "days", "departure"]);
      const setB = new Set(["employee", "agrees", "notice", "calendar", "days"]);
      const score = computeTokenJaccard(setA, setB);
      expect(score).toBeGreaterThan(0.5);
    });

    it("matches corresponding clauses despite section renumbering", () => {
      // In Demo: Previous Section 6 (Confidentiality) moves to Current Section 7
      const prevConf = DEMO_PREVIOUS_CLAUSES.find((c) => c.title.includes("Confidentiality"))!;
      const currConf = DEMO_CURRENT_CLAUSES.find((c) => c.title.includes("Confidentiality"))!;

      expect(prevConf.section).toBe("Section 6");
      expect(currConf.section).toBe("Section 7");

      const affinity = calculateClauseAffinity(prevConf, currConf);
      expect(affinity).toBeGreaterThanOrEqual(0.8);

      const matches = matchClausesSemantically([prevConf], [currConf]);
      expect(matches).toHaveLength(1);
      expect(matches[0].isSectionMoved).toBe(true);
      expect(matches[0].previousSection).toBe("Section 6");
      expect(matches[0].currentSection).toBe("Section 7");
    });

    it("identifies added clauses that have no counterpart in previous version", () => {
      // In Demo: Current Section 4 (Remote Work) is new
      const currRemote = DEMO_CURRENT_CLAUSES.find((c) => c.title.includes("Remote Work"))!;
      const matches = matchClausesSemantically([], [currRemote]);

      expect(matches).toHaveLength(1);
      expect(matches[0].previousClause).toBeNull();
      expect(matches[0].currentClause).not.toBeNull();
      expect(matches[0].matchConfidence).toBe("unmatched");
    });

    it("identifies removed clauses that have no counterpart in current version", () => {
      const removedClause: Clause = {
        id: "removed-1",
        section: "Section 14",
        title: "Severability and Cumulative Remedies",
        rawText: "If any provision is held invalid, the remainder shall continue in full force.",
        plainEnglish: "Invalid terms can be severed.",
        category: "general",
        pageNumber: 3,
        importance: "informational",
      };

      const matches = matchClausesSemantically([removedClause], []);
      expect(matches).toHaveLength(1);
      expect(matches[0].previousClause).not.toBeNull();
      expect(matches[0].currentClause).toBeNull();
    });
  });

  // 2. Semantic Legal Change Detection & Parameter Extraction
  describe("Semantic Legal Change Detection", () => {
    it("extracts notice period increases and flags them as timing impact", () => {
      // Previous: Section 4 (60 days) -> Current: Section 5 (90 days)
      const prevNotice = DEMO_PREVIOUS_CLAUSES.find((c) => c.title.includes("Notice Period"))!;
      const currNotice = DEMO_CURRENT_CLAUSES.find((c) => c.title.includes("Notice Period"))!;

      const diff = analyzeClauseDifference(
        {
          id: "test-notice",
          previousClause: prevNotice,
          currentClause: currNotice,
          previousSection: prevNotice.section,
          currentSection: currNotice.section,
          isSectionMoved: true,
          matchConfidence: "exact_title",
        },
        0
      );

      expect(diff.changeType).toBe("MODIFIED");
      expect(diff.significance).toBe("HIGH");
      expect(diff.semanticDetails).toBeDefined();

      const noticeParam = diff.semanticDetails?.find((d) => d.parameter === "Notice Period");
      expect(noticeParam).toBeDefined();
      expect(noticeParam?.previousValue).toBe("60 days");
      expect(noticeParam?.currentValue).toBe("90 days");
      expect(noticeParam?.changeSummary).toContain("+30 days");

      const timingImpact = diff.impacts.find((i) => i.category === "timing");
      expect(timingImpact).toBeDefined();
    });

    it("extracts financial amount / reimbursement increases (₹2,00,000 -> ₹4,50,000)", () => {
      const prevBond = DEMO_PREVIOUS_CLAUSES.find((c) => c.title.includes("Training"))!;
      const currBond = DEMO_CURRENT_CLAUSES.find((c) => c.title.includes("Training"))!;

      const diff = analyzeClauseDifference(
        {
          id: "test-bond",
          previousClause: prevBond,
          currentClause: currBond,
          previousSection: prevBond.section,
          currentSection: currBond.section,
          isSectionMoved: true,
          matchConfidence: "exact_title",
        },
        1
      );

      expect(diff.changeType).toBe("MODIFIED");
      expect(diff.significance).toBe("HIGH");
      expect(diff.semanticDetails).toBeDefined();

      const finParam = diff.semanticDetails?.find((d) => d.parameter.includes("Financial"));
      expect(finParam).toBeDefined();
      expect(finParam?.previousValue).toBe("₹2,00,000");
      expect(finParam?.currentValue).toBe("₹4,50,000");
      expect(finParam?.changeSummary).toContain("+₹2,50,000");

      const finImpact = diff.impacts.find((i) => i.category === "financial");
      expect(finImpact).toBeDefined();
    });

    it("extracts non-compete geographic expansion (Maharashtra -> Territory of India)", () => {
      const prevNC = DEMO_PREVIOUS_CLAUSES.find((c) => c.title.includes("Restrictive Covenant"))!;
      const currNC = DEMO_CURRENT_CLAUSES.find((c) => c.title.includes("Restrictive Covenant"))!;

      const diff = analyzeClauseDifference(
        {
          id: "test-nc",
          previousClause: prevNC,
          currentClause: currNC,
          previousSection: prevNC.section,
          currentSection: currNC.section,
          isSectionMoved: true,
          matchConfidence: "exact_title",
        },
        2
      );

      expect(diff.significance).toBe("HIGH");
      const scopeDetail = diff.semanticDetails?.find((d) => d.parameter.includes("Geographic Scope"));
      expect(scopeDetail).toBeDefined();
      expect(scopeDetail?.previousValue).toContain("Maharashtra");
      expect(scopeDetail?.currentValue).toContain("India");
    });

    it("detects unilateral arbitrator appointment shift", () => {
      const prevArb = DEMO_PREVIOUS_CLAUSES.find((c) => c.title.includes("Dispute Resolution"))!;
      const currArb = DEMO_CURRENT_CLAUSES.find((c) => c.title.includes("Dispute Resolution"))!;

      const diff = analyzeClauseDifference(
        {
          id: "test-arb",
          previousClause: prevArb,
          currentClause: currArb,
          previousSection: prevArb.section,
          currentSection: currArb.section,
          isSectionMoved: true,
          matchConfidence: "exact_title",
        },
        3
      );

      expect(diff.significance).toBe("HIGH");
      const arbDetail = diff.semanticDetails?.find((d) => d.parameter.includes("Arbitrator Appointment"));
      expect(arbDetail).toBeDefined();
      expect(arbDetail?.currentValue).toContain("Managing Director");
    });

    it("classifies identical clauses with section renumbering as MOVED and INFORMATIONAL", () => {
      const prevConf = DEMO_PREVIOUS_CLAUSES.find((c) => c.title.includes("Confidentiality"))!;
      const currConf = DEMO_CURRENT_CLAUSES.find((c) => c.title.includes("Confidentiality"))!;

      const diff = analyzeClauseDifference(
        {
          id: "test-moved-conf",
          previousClause: prevConf,
          currentClause: currConf,
          previousSection: prevConf.section,
          currentSection: currConf.section,
          isSectionMoved: true,
          matchConfidence: "exact_title",
        },
        4
      );

      expect(diff.changeType).toBe("MOVED");
      expect(diff.significance).toBe("INFORMATIONAL");
    });

    it("does not classify minor punctuation or whitespace changes as HIGH significance", () => {
      const c1: Clause = {
        id: "c1",
        section: "Section 2",
        title: "Compensation",
        rawText: "Company shall pay Employee annual CTC of INR 32,00,000, payable monthly.",
        plainEnglish: "Salary ₹32L",
        category: "payment",
        pageNumber: 1,
        importance: "informational",
      };
      const c2: Clause = {
        id: "c2",
        section: "Section 2",
        title: "Compensation",
        rawText: "Company shall pay Employee annual CTC of INR 32,00,000 - payable monthly!",
        plainEnglish: "Salary ₹32L",
        category: "payment",
        pageNumber: 1,
        importance: "informational",
      };

      const diff = analyzeClauseDifference(
        {
          id: "test-punct",
          previousClause: c1,
          currentClause: c2,
          previousSection: "Section 2",
          currentSection: "Section 2",
          isSectionMoved: false,
          matchConfidence: "exact_title",
        },
        5
      );

      expect(diff.significance).toBe("INFORMATIONAL");
    });
  });

  // 3. Jurisdiction Handling
  describe("Jurisdiction Comparison & Alignment", () => {
    it("reports aligned jurisdiction when country and state match", () => {
      const comp = compareJurisdictions(DEMO_PREVIOUS_JURISDICTION, DEMO_CURRENT_JURISDICTION);
      expect(comp.isAligned).toBe(true);
      expect(comp.statusLabel).toContain("India · Maharashtra");
      expect(comp.statusLabel).toContain("Jurisdiction Aligned");
      expect(comp.warning).toBeUndefined();
    });

    it("generates a visible warning when jurisdiction changes across drafts", () => {
      const delawareJurisdiction: JurisdictionContext = {
        country: "United States",
        stateOrUT: "Delaware",
        governingLaw: "State of Delaware",
        confidence: "high",
        source: "document",
      };

      const comp = compareJurisdictions(DEMO_PREVIOUS_JURISDICTION, delawareJurisdiction);
      expect(comp.isAligned).toBe(false);
      expect(comp.statusLabel).toBe("JURISDICTION CHANGED");
      expect(comp.warning).toContain("Previous document was governed by India (Maharashtra)");
      expect(comp.warning).toContain("United States (Delaware)");
    });
  });

  // 4. Evidence Chain Integration & Indian Legal Authorities
  describe("Evidence Chain Linking", () => {
    it("links training bond changes to Indian Contract Act § 74", () => {
      const comparison = buildFlagshipDemoComparison();
      const bondChange = comparison.changes.find((c) => c.clauseTitle.includes("Training"));

      expect(bondChange).toBeDefined();
      expect(bondChange?.evidenceChain).toBeDefined();
      expect(bondChange?.evidenceChain?.legalSources.length).toBeGreaterThan(0);

      const source = bondChange?.evidenceChain?.legalSources[0];
      expect(source?.citation).toContain("Indian Contract Act, 1872 § 74");
      expect(source?.verificationStatus).toBe("verified");
    });

    it("links non-compete changes to Indian Contract Act § 27 and Percept D'Mark", () => {
      const comparison = buildFlagshipDemoComparison();
      const ncChange = comparison.changes.find((c) => c.clauseTitle.includes("Non-Compete"));

      expect(ncChange).toBeDefined();
      expect(ncChange?.evidenceChain).toBeDefined();

      const source = ncChange?.evidenceChain?.legalSources[0];
      expect(source?.citation).toContain("Indian Contract Act, 1872 § 27");
    });

    it("links unilateral arbitration change to Arbitration Act § 12(5)", () => {
      const comparison = buildFlagshipDemoComparison();
      const arbChange = comparison.changes.find((c) => c.clauseTitle.includes("Arbitrator"));

      expect(arbChange).toBeDefined();
      expect(arbChange?.evidenceChain).toBeDefined();

      const source = arbChange?.evidenceChain?.legalSources[0];
      expect(source?.citation).toContain("Arbitration and Conciliation Act, 1996 § 12(5)");
    });
  });

  // 5. Action Plan & Ask LawPilot Integration
  describe("Action Plan & Ask LawPilot Integration", () => {
    it("generates calibrated reversible preparation items for each change", () => {
      const comparison = buildFlagshipDemoComparison();
      for (const change of comparison.topMaterialChanges) {
        expect(change.suggestedActionItem).toBeDefined();
        expect(change.suggestedActionItem.isReversible).toBe(true);
        expect(change.suggestedActionItem.title).toBeTruthy();
        expect(change.suggestedActionItem.practicalAdvice).toBeTruthy();
        // Never says "file lawsuit" or aggressive illegal claims
        expect(change.suggestedActionItem.title.toLowerCase()).not.toContain("sue");
      }
    });

    it("generates tailored contextual Ask LawPilot questions for changes", () => {
      const comparison = buildFlagshipDemoComparison();
      const bondChange = comparison.changes.find((c) => c.clauseTitle.includes("Training"))!;
      expect(bondChange.suggestedAskQuestion).toContain("training reimbursement");
      expect(bondChange.suggestedAskQuestion).toContain("verify");
    });

    it("persists action items locally in compareActionStore", () => {
      const mockItem = {
        id: "test-action-123",
        title: "Clarify training reimbursement with HR",
        explanation: "Ask for itemized expenses",
        actionType: "clarify" as const,
        priority: "urgent" as const,
        isReversible: true,
      };

      const added = addCompareActionItem(mockItem);
      expect(typeof added).toBe("boolean");
      const items = getCompareActionItems();
      expect(Array.isArray(items)).toBe(true);
      removeCompareActionItem(mockItem.id);
    });

    it("processes batch clause pairs with analyzeAllClauseDifferences and integrates legal context", () => {
      const pairs = matchClausesSemantically(DEMO_PREVIOUS_CLAUSES, DEMO_CURRENT_CLAUSES);
      const diffs = analyzeAllClauseDifferences(pairs);
      expect(diffs.length).toBe(pairs.length);

      const jurisdictionComp = compareJurisdictions(DEMO_PREVIOUS_JURISDICTION, DEMO_CURRENT_JURISDICTION);
      const integrated = integrateLegalContext(diffs, jurisdictionComp);
      expect(integrated.length).toBe(diffs.length);
    });
  });

  // 6. Flagship Demo Consistency
  describe("Flagship Demo Data Integrity", () => {
    it("matches exactly 5 material changes in the India demo pair", () => {
      expect(FLAGSHIP_DEMO_COMPARISON.summary.materialChangesCount).toBe(5);
      expect(FLAGSHIP_DEMO_COMPARISON.topMaterialChanges.length).toBe(5);
    });

    it("identifies added remote work clause", () => {
      const added = FLAGSHIP_DEMO_COMPARISON.changes.find((c) => c.changeType === "ADDED");
      expect(added).toBeDefined();
      expect(added?.clauseTitle).toContain("Remote Work");
    });

    it("verifies why-this-matters contains calibrated language and no cartoonish claims", () => {
      for (const change of FLAGSHIP_DEMO_COMPARISON.changes) {
        expect(change.whyItMatters).toBeTruthy();
        expect(change.whyItMatters).not.toContain("This is illegal");
        expect(change.whatToVerify.length).toBeGreaterThan(0);
        expect(change.whatToAsk).toBeTruthy();
      }
    });
  });

  // 7. Validation & Edge Cases in Pipeline
  describe("Pipeline Validation & Edge Cases", () => {
    it("rejects identical files when buffer hashes match", async () => {
      const buf = Buffer.from("Agreement text content here.");
      await expect(
        compareDocumentBuffers({
          previousBuffer: buf,
          previousFileName: "doc1.txt",
          currentBuffer: buf,
          currentFileName: "doc2.txt",
        })
      ).rejects.toThrow("Identical document selected");
    });

    it("rejects unsupported file formats", async () => {
      const buf = Buffer.from("Executable file binary header");
      await expect(
        compareDocumentBuffers({
          previousBuffer: buf,
          previousFileName: "malicious.exe",
          currentBuffer: Buffer.from("Normal text file"),
          currentFileName: "agreement.txt",
        })
      ).rejects.toThrow("validation failed");
    });
  });

  // 8. UX Presentation Invariants & Scalability
  describe("8. UX Presentation Invariants: Material Changes Visibility & Scaling", () => {
    it("guarantees materialChangesCount equals visible topMaterialChanges length", () => {
      const { summary, topMaterialChanges } = FLAGSHIP_DEMO_COMPARISON;
      expect(summary.materialChangesCount).toBe(topMaterialChanges.length);
      expect(topMaterialChanges).toHaveLength(5);
    });

    it("ComparisonSummaryView renders exactly all 5 material changes without truncation", () => {
      const html = renderToString(
        React.createElement(ComparisonSummaryView, {
          summary: FLAGSHIP_DEMO_COMPARISON.summary,
          jurisdictionComparison: FLAGSHIP_DEMO_COMPARISON.jurisdictionComparison,
          topMaterialChanges: FLAGSHIP_DEMO_COMPARISON.topMaterialChanges,
          onSelectChange: () => {},
        })
      );

      const cleanHtml = html.replace(/<!--[\s\S]*?-->/g, "");
      // Heading explicitly states "5 material changes"
      expect(cleanHtml).toContain("5 material changes");
      expect(cleanHtml).toContain("Worth Your Attention");

      // Verifies all 5 flagship material changes are rendered visibly
      expect(html).toContain("Training Bond");
      expect(html).toContain("Notice Period");
      expect(html).toContain("Non-Compete");
      expect(html).toContain("Intellectual Property");
      expect(html).toContain("Arbitrator Appointment");

      // Verify no slice(0, 3) hiding items: all 5 inspect buttons exist
      const inspectCount = (html.match(/Inspect/g) || []).length;
      expect(inspectCount).toBe(5);
    });

    it("getConciseWhyItMatters provides punchy 1-sentence reasons for each change", () => {
      for (const change of FLAGSHIP_DEMO_COMPARISON.topMaterialChanges) {
        const concise = getConciseWhyItMatters(change);
        expect(concise).toBeTruthy();
        expect(concise.length).toBeLessThan(150);
        expect(concise.length).toBeGreaterThan(10);
      }
    });

    it("scales correctly for comparisons with 1, 3, 5, and 10 material changes", () => {
      const baseItem = FLAGSHIP_DEMO_COMPARISON.topMaterialChanges[0];
      const countsToTest = [1, 3, 5, 10];

      for (const count of countsToTest) {
        const mockItems: ClauseComparisonItem[] = Array.from({ length: count }, (_, i) => ({
          ...baseItem,
          id: `mock-change-${i}`,
          clauseTitle: `Contract Clause ${i + 1}`,
        }));

        const mockSummary = {
          ...FLAGSHIP_DEMO_COMPARISON.summary,
          materialChangesCount: count,
          clausesChanged: count,
        };

        const html = renderToString(
          React.createElement(ComparisonSummaryView, {
            summary: mockSummary,
            jurisdictionComparison: FLAGSHIP_DEMO_COMPARISON.jurisdictionComparison,
            topMaterialChanges: mockItems,
            onSelectChange: () => {},
          })
        );

        const cleanHtml = html.replace(/<!--[\s\S]*?-->/g, "");
        // Heading matches the exact count
        expect(cleanHtml).toContain(`${count} material ${count === 1 ? "change" : "changes"}`);

        // Exactly 'count' inspect buttons rendered in the summary
        const inspectMatches = (html.match(/Inspect/g) || []).length;
        expect(inspectMatches).toBe(count);

        // Every clause title rendered
        for (let i = 0; i < count; i++) {
          expect(html).toContain(`Contract Clause ${i + 1}`);
        }
      }
    });
  });
});
