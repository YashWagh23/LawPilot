import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import React from "react";
import { renderToString } from "react-dom/server";
import { orchestrateDocumentAnalysis } from "@/lib/analysis/analysisOrchestrator";
import { SAMPLE_ANALYSIS_REPORT } from "@/lib/demo/sampleAnalysis";
import { identifyImportantClausesAndFindings } from "@/lib/ai/agents/riskAnalysisAgent";
import { generateDeterministicLawyerBrief } from "@/lib/analysis/deterministicLawyerBrief";
import {
  buildKeyTakeaway,
  deriveOverallReadiness,
  HEURISTIC_FINDING_LABEL,
  HEURISTIC_FINDING_UNCERTAINTY,
  isHeuristicReport,
} from "@/lib/analysis/analysisSummary";
import { getChainVerificationBadge, getReportVerificationState } from "@/lib/analysis/verificationState";
import { AnalysisClientView } from "@/components/analysis/AnalysisClientView";
import { EvidenceChainCard } from "@/components/evidence/EvidenceChainCard";
import { LawyerBriefView } from "@/components/lawyer-brief/LawyerBrief";
import type { AnalysisReport, Clause, EvidenceChain } from "@/types";

const fixture = (name: string) => fs.readFileSync(path.join(__dirname, "fixtures", name));
const html = (el: React.ReactElement) => renderToString(el).replace(/<!--[\s\S]*?-->/g, "");

const clause = (over: Partial<Clause> & Pick<Clause, "id" | "title" | "rawText" | "category">): Clause => ({
  section: "Section 1",
  plainEnglish: "",
  pageNumber: 1,
  importance: "review",
  ...over,
});

/** The header badge markup, isolated so assertions cannot be satisfied by "Verified" elsewhere on the page. */
function headerBadge(markup: string): string {
  const match = markup.match(/<span[^>]*data-testid="verification-badge"[^>]*>[\s\S]*?<\/span>/);
  expect(match, "verification badge is rendered").not.toBeNull();
  return match![0];
}

// ────────────────────────────────────────────────────────────────────────────
describe("Verification badge never says Verified without verified sources", () => {
  it("a report with no evidence chains is Not verified", () => {
    const state = getReportVerificationState({ evidenceChains: [] });
    expect(state.label).toBe("Not verified");
    expect(state.tone).toBe("unverified");
    expect(state.verifiedSourceCount).toBe(0);
  });

  it("the UK services agreement (no curated sources, every chain insufficient_context) renders Not verified in the header", async () => {
    const report = await orchestrateDocumentAnalysis(fixture("saas_services_uk.txt"), "saas.txt");
    expect(report.evidenceChains.length).toBeGreaterThan(0);
    expect(report.evidenceChains.every((c) => c.verification.status === "insufficient_context")).toBe(true);

    const state = getReportVerificationState(report);
    expect(state.verifiedSourceCount).toBe(0);
    expect(state.label).toBe("Not verified");

    const badge = headerBadge(html(React.createElement(AnalysisClientView, { report })));
    expect(badge).toContain("Not verified");
    expect(badge).toContain('data-verification-state="unverified"');
    expect(badge).not.toMatch(/>\s*Verified\s*</);
    expect(badge).not.toMatch(/emerald/);
  });

  it("an unverified chain is labelled Not verified, never Verified or Contextual", async () => {
    const report = await orchestrateDocumentAnalysis(fixture("saas_services_uk.txt"), "saas.txt");
    const chain = report.evidenceChains[0];
    const markup = html(React.createElement(EvidenceChainCard, { chain, defaultExpanded: false }));
    expect(markup).toContain("Not verified");
    expect(markup).not.toMatch(/>Verified</);
    expect(markup).not.toContain("Contextual");
    expect(chain.confidence?.rationale).toMatch(/^Not verified/);
    expect(chain.confidence?.rationale).not.toMatch(/Verified (?:with notes|against)/);
  });

  it("a chain marked verified but with no legal source behind it is not shown as verified", async () => {
    const report = await orchestrateDocumentAnalysis(fixture("saas_services_uk.txt"), "saas.txt");
    const hollow: EvidenceChain = { ...report.evidenceChains[0], legalSources: [], verification: { ...report.evidenceChains[0].verification, status: "verified" } };
    expect(getChainVerificationBadge(hollow).label).toBe("Not verified");
    expect(getReportVerificationState({ evidenceChains: [hollow] }).label).toBe("Not verified");
  });

  it("the flagship demo report, whose chains carry verified sources, still shows Verified", () => {
    const state = getReportVerificationState(SAMPLE_ANALYSIS_REPORT);
    expect(state.verifiedSourceCount).toBeGreaterThan(0);
    expect(state.label).toBe("Verified");
    const badge = headerBadge(html(React.createElement(AnalysisClientView, { report: SAMPLE_ANALYSIS_REPORT })));
    expect(badge).toContain('data-verification-state="verified"');
    expect(badge).toMatch(/>\s*Verified\s*</);
  });

  it("a mix of verified and unverified chains reads Partially verified", () => {
    const [first, ...rest] = SAMPLE_ANALYSIS_REPORT.evidenceChains;
    const unverified: EvidenceChain = { ...rest[0], legalSources: [], verification: { ...rest[0].verification, status: "insufficient_context" } };
    const state = getReportVerificationState({ evidenceChains: [first, unverified] });
    expect(state.label).toBe("Partially verified");
    expect(state.tone).toBe("partial");
  });

  it("the Pune lease badge agrees with its own chains (India sources exist, so it is not blanket-labelled)", async () => {
    const report = await orchestrateDocumentAnalysis(fixture("leave_and_licence_pune.txt"), "lease.txt");
    const state = getReportVerificationState(report);
    const anyVerified = report.evidenceChains.some((c) => c.verification.status === "verified" && c.legalSources.length > 0);
    expect(state.label === "Not verified").toBe(!anyVerified && !report.evidenceChains.some((c) => c.verification.status === "partially_verified"));
    const badge = headerBadge(html(React.createElement(AnalysisClientView, { report })));
    expect(badge).toContain(state.label);
  });

  it("the lawyer brief shows no ✓ Verified when it has no verified legal context", async () => {
    const report = await orchestrateDocumentAnalysis(fixture("saas_services_uk.txt"), "saas.txt");
    const brief = report.detailedLawyerBrief!;
    expect(brief.verifiedLegalContext).toHaveLength(0);
    const markup = html(React.createElement(LawyerBriefView, { brief }));
    expect(markup).not.toContain("✓ Verified");
    expect(markup).toContain("Not verified: no legal source could be verified");
  });
});

// ────────────────────────────────────────────────────────────────────────────
describe("Heuristic fallback is labelled as such", () => {
  it("with no AI, the Pune lease summary says it is a heuristic scan and makes no 'customary' claim", async () => {
    const report = await orchestrateDocumentAnalysis(fixture("leave_and_licence_pune.txt"), "lease.txt");
    expect(report.aiStatus?.mode).toBe("deterministic");
    expect(isHeuristicReport(report)).toBe(true);
    expect(report.summary.keyTakeaway).toMatch(/^Heuristic scan \(AI analysis unavailable\)/);
    expect(report.summary.keyTakeaway).not.toMatch(/customary|standard contractual/i);
    expect(report.summary.overallReadiness).not.toBe("standard_terms");
  });

  it("every fallback finding is labelled as a heuristic flag and lists the caveat first", async () => {
    for (const [file, name] of [
      ["leave_and_licence_pune.txt", "lease.txt"],
      ["services_agreement_us.txt", "services.txt"],
      ["saas_services_uk.txt", "saas.txt"],
    ] as const) {
      const report = await orchestrateDocumentAnalysis(fixture(file), name);
      expect(report.findings.length).toBeGreaterThan(0);
      for (const f of report.findings) {
        expect(f.description.startsWith(`${HEURISTIC_FINDING_LABEL}: `)).toBe(true);
        expect(f.whyItMatters).toMatch(/^Heuristic flag, not a legal conclusion:/);
        expect(f.uncertainties[0]).toBe(HEURISTIC_FINDING_UNCERTAINTY);
      }
    }
  });

  it("the UI summary line for a finding still shows the label (first-sentence truncation keeps it)", async () => {
    const { toFindingPresentation } = await import("@/lib/analysis/presentationTransformer");
    const report = await orchestrateDocumentAnalysis(fixture("services_agreement_us.txt"), "services.txt");
    const presentation = toFindingPresentation(report.findings[0], report);
    expect(presentation.summary.startsWith(HEURISTIC_FINDING_LABEL)).toBe(true);
    expect(presentation.whatToVerify[0]).toBe(HEURISTIC_FINDING_UNCERTAINTY);
  });

  it("a document with nothing flagged does not claim customary or standard terms", async () => {
    const benign = [
      "GENERAL NOTE",
      "",
      "1. Purpose",
      "This note records that the two parties met on the stated date to discuss a possible future arrangement.",
      "",
      "2. Contacts",
      "Each party has named one representative who will be the point of contact for scheduling further discussions.",
    ].join("\n");
    const report = await orchestrateDocumentAnalysis(Buffer.from(benign, "utf8"), "note.txt");
    expect(report.findings).toHaveLength(0);
    expect(report.summary.keyTakeaway).toMatch(/does not mean the terms are standard or low-risk/);
    expect(report.summary.keyTakeaway).not.toMatch(/customary|Extracted standard/i);
    expect(report.summary.overallReadiness).toBe("review_recommended");
  });

  it("the deterministic lawyer brief says its findings come from a heuristic scan", async () => {
    const report = await orchestrateDocumentAnalysis(fixture("leave_and_licence_pune.txt"), "lease.txt");
    expect(report.detailedLawyerBrief!.matterSummary).toContain("rule-based (heuristic) scan");
    const client = generateDeterministicLawyerBrief({
      documentId: report.documentId,
      documentTitle: report.metadata.title,
      documentType: report.metadata.documentType,
      parties: [],
      documentSummary: report.summary.keyTakeaway,
      findings: report.findings,
      clauses: report.clauses,
      evidenceChains: report.evidenceChains,
      heuristic: isHeuristicReport(report),
    });
    expect(client.matterSummary).toContain("rule-based (heuristic) scan");
  });

  it("when AI ran, findings and summary are untouched and never claim customary terms", () => {
    const clauses = [
      clause({ id: "c1", section: "Section 5", title: "Notice", category: "notice", rawText: "Either party may terminate on thirty (30) days written notice." }),
    ];
    const live = identifyImportantClausesAndFindings({ documentId: "d", clauses, documentType: "services_agreement" });
    const heuristic = identifyImportantClausesAndFindings({ documentId: "d", clauses, documentType: "services_agreement", heuristic: true });
    expect(live.findings[0].description.startsWith(HEURISTIC_FINDING_LABEL)).toBe(false);
    expect(heuristic.findings[0].description.startsWith(HEURISTIC_FINDING_LABEL)).toBe(true);

    const none = { criticalAttentionCount: 0, highAttentionCount: 0, reviewCount: 0 };
    expect(buildKeyTakeaway(none, false)).not.toMatch(/customary|standard contractual/i);
    expect(buildKeyTakeaway(none, false)).toMatch(/not a finding that the terms are standard/);
    expect(deriveOverallReadiness(none, false)).toBe("standard_terms");
    expect(deriveOverallReadiness(none, true)).toBe("review_recommended");
    expect(buildKeyTakeaway({ ...none, highAttentionCount: 2 }, true)).toMatch(/^Heuristic scan/);
    expect(buildKeyTakeaway({ ...none, highAttentionCount: 2 }, false)).toBe("Identified 2 clause(s) that deserve close attention prior to execution.");
  });

  it("the demo report (no aiStatus) is not treated as a heuristic report", () => {
    const report: Pick<AnalysisReport, "aiStatus"> = { aiStatus: undefined };
    expect(isHeuristicReport(report)).toBe(false);
  });
});
