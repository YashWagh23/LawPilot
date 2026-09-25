import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import React from "react";
import { renderToString } from "react-dom/server";
import { orchestrateDocumentAnalysis } from "@/lib/analysis/analysisOrchestrator";
import { SAMPLE_ANALYSIS_REPORT } from "@/lib/demo/sampleAnalysis";
import { identifyImportantClausesAndFindings } from "@/lib/ai/agents/riskAnalysisAgent";
import {
  generateDeterministicLawyerBrief,
  LAWYER_BRIEF_STANDARD_DISCLAIMER,
  LAWYER_BRIEF_UNVERIFIED_DISCLAIMER,
} from "@/lib/analysis/deterministicLawyerBrief";
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
import { EvidenceChainDetailModal } from "@/components/evidence/EvidenceChainDetailModal";
import { LawyerBriefView, generateLawyerBriefMarkdown } from "@/components/lawyer-brief/LawyerBrief";
import { formatJurisdictionBadge } from "@/lib/jurisdiction/jurisdictionDetector";
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

// ────────────────────────────────────────────────────────────────────────────
describe("Regression: US pet-sitting agreement under Oregon law with no matching curated legal source", () => {
  it("satisfies all verification and jurisdiction invariants across orchestrator, UI, cards, modal, and brief", async () => {
    const report = await orchestrateDocumentAnalysis(fixture("pet_sitting_oregon.txt"), "pet_sitting.txt");

    // 1. Jurisdiction detection
    expect(report.jurisdictionContext).toBeDefined();
    expect(report.jurisdictionContext?.country).toBe("United States");
    expect(report.jurisdictionContext?.stateOrUT).toBe("Oregon");
    const formattedJurisdiction = formatJurisdictionBadge(report.jurisdictionContext);
    expect(formattedJurisdiction).toBe("United States · Oregon");

    // 2. Centralized verification state
    const reportState = getReportVerificationState(report);
    expect(reportState.tone).toBe("unverified");
    expect(reportState.label).toBe("Not verified");
    expect(reportState.verifiedSourceCount).toBe(0);

    // 3. Evidence chains jurisdiction and verification status
    expect(report.evidenceChains.length).toBeGreaterThan(0);
    for (const chain of report.evidenceChains) {
      expect(chain.verification.status).toBe("insufficient_context");
      expect(chain.legalSources).toHaveLength(0);
      expect(chain.jurisdictionContext).toBeDefined();
      expect(formatJurisdictionBadge(chain.jurisdictionContext)).toBe("United States · Oregon");
      const chainBadge = getChainVerificationBadge(chain);
      expect(chainBadge.label).toBe("Not verified");
      expect(chainBadge.tone).toBe("unverified");
    }

    // 4. AnalysisClientView (Header, Trust Strip, UI)
    const clientHtml = html(React.createElement(AnalysisClientView, { report }));
    const badge = headerBadge(clientHtml);
    expect(badge).toContain("Not verified");
    expect(badge).toContain('data-verification-state="unverified"');
    expect(badge).not.toMatch(/>\s*Verified\s*</);
    expect(badge).not.toMatch(/emerald/);

    // Trust strip & UI checks
    expect(clientHtml).toContain("Not verified");
    expect(clientHtml).toContain("insufficient legal context");
    expect(clientHtml).not.toMatch(/verified grounding/i);
    expect(clientHtml).not.toMatch(/verified legal context/i);
    expect(clientHtml).not.toContain("Jurisdiction not established");
    expect(clientHtml).toContain("United States · Oregon");

    // 5. EvidenceChainCard
    const cardHtml = html(React.createElement(EvidenceChainCard, {
      chain: report.evidenceChains[0],
      defaultExpanded: true,
      documentJurisdiction: report.jurisdictionContext,
    }));
    expect(cardHtml).toContain("United States · Oregon");
    expect(cardHtml).toContain("Not verified");
    expect(cardHtml).toContain("insufficient legal context");
    expect(cardHtml).not.toContain("Jurisdiction not established");
    expect(cardHtml).not.toMatch(/>\s*Verified\s*</);
    expect(cardHtml).toContain("Authoritative verification was not found in the designated jurisdiction");

    // 6. EvidenceChainDetailModal
    const modalHtml = html(React.createElement(EvidenceChainDetailModal, {
      chain: report.evidenceChains[0],
      isOpen: true,
      onClose: () => {},
      documentJurisdiction: report.jurisdictionContext,
      reportVerificationState: reportState,
    }));
    expect(modalHtml).toContain("United States · Oregon");
    expect(modalHtml).not.toContain("Jurisdiction not established");
    expect(modalHtml).toContain("2. Legal Context &amp; Authority");
    expect(modalHtml).not.toContain("Supported Legal Source");
    expect(modalHtml).toContain("insufficient context");
    expect(modalHtml).toContain("NOT VERIFIED");
    expect(modalHtml).toContain("(INSUFFICIENT CONFIDENCE)");
    // Footer never claims grounded in verifiable legal authority when unverified
    expect(modalHtml).not.toContain("Grounded in verifiable legal authority");
    expect(modalHtml).toContain("Factual clause analysis (no verified legal authority)");

    // 7. LawyerBriefView
    const brief = report.detailedLawyerBrief!;
    expect(brief).toBeDefined();
    expect(brief.document.jurisdiction).toBe("United States · Oregon");
    expect(brief.verifiedLegalContext).toHaveLength(0);
    // Disclaimer never claims verified statutory context when unverified
    expect(brief.disclaimer).toBe(LAWYER_BRIEF_UNVERIFIED_DISCLAIMER);
    expect(brief.disclaimer).not.toContain("verified statutory context");
    expect(brief.disclaimer).toContain("no legal authority was verified");

    const briefHtml = html(React.createElement(LawyerBriefView, { brief }));
    expect(briefHtml).toContain("United States · Oregon");
    expect(briefHtml).not.toContain("Jurisdiction not established");
    // Subtitle must not say "verified legal context"
    expect(briefHtml).not.toContain("verified legal context");
    expect(briefHtml).toContain("factual clause analysis");
    // Section 5 title must not say "Verified Legal Context"
    expect(briefHtml).toContain("Legal Context &amp; Authorities");
    expect(briefHtml).not.toContain("Verified Legal Context");
    // Section 5 badge & empty text
    expect(briefHtml).toContain("Not verified");
    expect(briefHtml).toContain("insufficient legal context");
    expect(briefHtml).not.toContain("✓ Verified");
    // Section 10 disclaimer rendered in HTML
    expect(briefHtml).toContain("no legal authority was verified");
    expect(briefHtml).not.toContain("verified statutory context");

    // 8. Lawyer Brief Markdown export
    const briefMd = generateLawyerBriefMarkdown(brief);
    expect(briefMd).toContain("Jurisdiction:** United States · Oregon");
    expect(briefMd).toContain("## 5. LEGAL CONTEXT & AUTHORITIES");
    expect(briefMd).not.toContain("## 5. VERIFIED LEGAL CONTEXT & AUTHORITIES");
    expect(briefMd).not.toMatch(/VERIFIED LEGAL CONTEXT/i);
    expect(briefMd).toContain("Not verified: no legal source could be verified");
    expect(briefMd).toContain("insufficient legal context");
    expect(briefMd).not.toContain("verified statutory context");
    expect(briefMd).toContain("no legal authority was verified");

    // 9. Deterministic fallback brief with Oregon context preserves jurisdiction & unverified state
    const fallbackBrief = generateDeterministicLawyerBrief({
      documentId: report.documentId,
      documentTitle: report.metadata.title,
      documentType: report.metadata.documentType,
      parties: [],
      documentSummary: report.summary.keyTakeaway,
      findings: report.findings,
      clauses: report.clauses,
      evidenceChains: report.evidenceChains,
      heuristic: isHeuristicReport(report),
      jurisdictionContext: report.jurisdictionContext,
    });
    expect(fallbackBrief.document.jurisdiction).toBe("United States · Oregon");
    expect(fallbackBrief.verificationState?.tone).toBe("unverified");
    expect(fallbackBrief.verificationState?.label).toBe("Not verified");
    expect(fallbackBrief.verifiedLegalContext).toHaveLength(0);
    expect(fallbackBrief.disclaimer).toBe(LAWYER_BRIEF_UNVERIFIED_DISCLAIMER);
    expect(fallbackBrief.disclaimer).not.toContain("verified statutory context");
    expect(fallbackBrief.disclaimer).toContain("no legal authority was verified");

    const fallbackHtml = html(React.createElement(LawyerBriefView, { brief: fallbackBrief }));
    expect(fallbackHtml).toContain("United States · Oregon");
    expect(fallbackHtml).not.toContain("Verified Legal Context");
    expect(fallbackHtml).toContain("Not verified");
    expect(fallbackHtml).toContain("insufficient legal context");
    expect(fallbackHtml).toContain("no legal authority was verified");
    expect(fallbackHtml).not.toContain("verified statutory context");
  });

  it("the demo report (with verified sources) maintains standard disclaimer and grounded modal footer", () => {
    const verifiedBrief = SAMPLE_ANALYSIS_REPORT.detailedLawyerBrief!;
    expect(verifiedBrief.disclaimer).toContain("verified");
    expect(verifiedBrief.disclaimer).toContain("statutory context");

    const verifiedModalHtml = html(React.createElement(EvidenceChainDetailModal, {
      chain: SAMPLE_ANALYSIS_REPORT.evidenceChains[0],
      isOpen: true,
      onClose: () => {},
      documentJurisdiction: SAMPLE_ANALYSIS_REPORT.jurisdictionContext,
      reportVerificationState: getReportVerificationState(SAMPLE_ANALYSIS_REPORT),
    }));
    expect(verifiedModalHtml).toContain("LawPilot Evidence Chain · Grounded in verifiable legal authority");
    expect(verifiedModalHtml).not.toContain("no verified legal authority");

    const usVerifiedBrief = generateDeterministicLawyerBrief({
      documentId: "us-doc",
      documentTitle: "Employment Agreement",
      documentType: "employment_agreement",
      parties: ["Company", "Employee"],
      documentSummary: "Employment agreement.",
      findings: SAMPLE_ANALYSIS_REPORT.findings,
      clauses: SAMPLE_ANALYSIS_REPORT.clauses,
      evidenceChains: SAMPLE_ANALYSIS_REPORT.evidenceChains,
      jurisdiction: "Delaware",
      jurisdictionContext: {
        country: "United States",
        stateOrUT: "Delaware",
        confidence: "high",
        source: "document",
      },
    });
    expect(usVerifiedBrief.disclaimer).toBe(LAWYER_BRIEF_STANDARD_DISCLAIMER);
    expect(usVerifiedBrief.disclaimer).toContain("verified statutory context");
  });
});

