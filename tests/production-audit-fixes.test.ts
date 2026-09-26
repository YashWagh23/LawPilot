import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import fs from "fs";
import path from "path";
import React from "react";
import { renderToString } from "react-dom/server";
import { z } from "zod";

// ── Mock the Gemini SDK so the client's retry / fallback / breaker logic is tested offline ─────
const generateContent = vi.fn();
vi.mock("@google/genai", () => {
  class GoogleGenAI {
    models = { generateContent };
  }
  return { GoogleGenAI, ThinkingLevel: { LOW: "LOW", MINIMAL: "MINIMAL" } };
});

import { AiRunTracker, generateJson, resetGeminiCircuitBreaker } from "@/lib/ai/gemini";
import { detectJurisdiction, getJurisdictionFamily } from "@/lib/jurisdiction/jurisdictionDetector";
import { orchestrateDocumentAnalysis } from "@/lib/analysis/analysisOrchestrator";
import { extractDurations, extractMoneyAmounts } from "@/lib/documents/measures";
import { splitSentences } from "@/lib/utils";
import { extractStandoutValue } from "@/lib/analysis/presentationTransformer";
import { identifyImportantClausesAndFindings } from "@/lib/ai/agents/riskAnalysisAgent";
import { generateDeterministicActionPlan } from "@/lib/analysis/deterministicActionPlan";
import { matchClausesSemantically } from "@/lib/comparison/clauseMatcher";
import { analyzeAllClauseDifferences } from "@/lib/comparison/semanticChangeDetector";
import { compareJurisdictions, integrateLegalContext } from "@/lib/comparison/legalContextIntegrator";
import { FLAGSHIP_DEMO_COMPARISON, FLAGSHIP_DEMO_COMPARISON_SWAPPED } from "@/lib/demo/compareDemoData";
import { ComparisonSummaryView } from "@/components/compare/ComparisonSummaryView";
import { DocumentViewer } from "@/components/document/DocumentViewer";
import { askLawPilot } from "@/lib/ai/ask/askEngine";
import { SAMPLE_ANALYSIS_REPORT } from "@/lib/demo/sampleAnalysis";
import { generateDeterministicSituationAssessment } from "@/lib/ai/situation/situationEngine";
import type { AnalysisReport, Clause } from "@/types";

const fixture = (name: string) => fs.readFileSync(path.join(__dirname, "fixtures", name));

const clause = (over: Partial<Clause> & Pick<Clause, "id" | "title" | "rawText" | "category">): Clause => ({
  section: over.section ?? "Section 1",
  plainEnglish: "",
  pageNumber: 1,
  importance: "review",
  ...over,
});

// ────────────────────────────────────────────────────────────────────────────
describe("1. Gemini client: failures are handled and visible, never silent", () => {
  const schema = z.object({ ok: z.boolean() });

  beforeEach(() => {
    process.env.GEMINI_API_KEY = "test-key";
    generateContent.mockReset();
    resetGeminiCircuitBreaker();
  });
  afterEach(() => {
    delete process.env.GEMINI_API_KEY;
  });

  it("falls back to the next model on quota (429) and records what happened", async () => {
    generateContent
      .mockRejectedValueOnce(Object.assign(new Error('{"error":{"code":429,"message":"quota"}} retry in 40s'), { status: 429 }))
      .mockResolvedValueOnce({ text: '{"ok":true}', candidates: [] });
    const tracker = new AiRunTracker();
    const result = await generateJson({ label: "t", contents: "x", schema, tracker });
    expect(result.ok).toBe(true);
    expect(generateContent.mock.calls[0][0].model).not.toBe(generateContent.mock.calls[1][0].model);
    const summary = tracker.summarize();
    expect(summary.mode).toBe("live");
    expect(summary.errors.join(" ")).toContain("429");
  });

  it("reports failure explicitly (and trips the breaker) when every model fails", async () => {
    generateContent.mockRejectedValue(Object.assign(new Error("overloaded"), { status: 503 }));
    const tracker = new AiRunTracker();
    const first = await generateJson({ label: "a", contents: "x", schema, tracker, totalTimeoutMs: 8000 });
    expect(first.ok).toBe(false);
    expect(tracker.summarize().mode).toBe("deterministic");

    const callsBefore = generateContent.mock.calls.length;
    const second = await generateJson({ label: "b", contents: "x", schema, tracker });
    expect(second.ok).toBe(false);
    // Breaker: no new provider calls while cooling down.
    expect(generateContent.mock.calls.length).toBe(callsBefore);
  });

  it("treats a schema-invalid response as a failure instead of trusting it", async () => {
    generateContent.mockResolvedValue({ text: '{"nope":1}', candidates: [] });
    const result = await generateJson({ label: "s", contents: "x", schema, totalTimeoutMs: 6000 });
    expect(result.ok).toBe(false);
  });

  it("reuses a cached answer for an identical request instead of spending quota again", async () => {
    generateContent.mockResolvedValue({ text: '{"ok":true}', candidates: [] });
    const first = await generateJson({ label: "c", contents: "same prompt", schema });
    const tracker = new AiRunTracker();
    const second = await generateJson({ label: "c", contents: "same prompt", schema, tracker });
    expect(first.ok && second.ok).toBe(true);
    expect(generateContent).toHaveBeenCalledTimes(1);
    expect(tracker.summarize().mode).toBe("live");

    await generateJson({ label: "c", contents: "different prompt", schema });
    expect(generateContent).toHaveBeenCalledTimes(2);
  });

  it("shares one provider call between concurrent identical requests", async () => {
    generateContent.mockResolvedValue({ text: '{"ok":true}', candidates: [] });
    const [a, b] = await Promise.all([
      generateJson({ label: "d", contents: "x", schema }),
      generateJson({ label: "d", contents: "x", schema }),
    ]);
    expect(a.ok && b.ok).toBe(true);
    expect(generateContent).toHaveBeenCalledTimes(1);
  });

  it("skips a model that just ran out of quota on the next call", async () => {
    generateContent
      .mockRejectedValueOnce(Object.assign(new Error("quota exceeded GenerateRequestsPerDayPerProjectPerModel"), { status: 429 }))
      .mockResolvedValue({ text: '{"ok":true}', candidates: [] });
    await generateJson({ label: "q", contents: "first", schema });
    const exhaustedModel = generateContent.mock.calls[0][0].model;

    await generateJson({ label: "q", contents: "second", schema });
    expect(generateContent).toHaveBeenCalledTimes(3);
    expect(generateContent.mock.calls[2][0].model).not.toBe(exhaustedModel);
  });

  it("returns a clear failure when no key is configured", async () => {
    delete process.env.GEMINI_API_KEY;
    const result = await generateJson({ label: "k", contents: "x", schema });
    expect(result).toEqual({ ok: false, reason: "GEMINI_API_KEY is not configured" });
  });
});

// ────────────────────────────────────────────────────────────────────────────
describe("2/3. Jurisdiction detection and no cross-jurisdiction leakage", () => {
  it("does not confuse Indiana with India, or words containing UK/Rs with places/currency", () => {
    const j = detectJurisdiction({ text: "This Agreement is governed by the laws of the State of Indiana." });
    expect(j.country).toBe("United States");
    expect(j.stateOrUT).toBe("Indiana");
    const none = detectJurisdiction({ text: "Working hours 5 per day. Duke and users, 100 in number." });
    expect(none.country).toBe("Unknown");
  });

  it("recognizes England and Wales, and an explicit governing law beats a foreign venue", () => {
    expect(detectJurisdiction({ text: "governed by the laws of England and Wales." }).country).toBe("United Kingdom");
    const j = detectJurisdiction({
      text: "This Agreement shall be governed by the laws of India. The courts at Singapore shall have exclusive jurisdiction.",
    });
    expect(j.country).toBe("India");
  });

  it("ignores bare six-digit numbers as PIN codes", () => {
    const j = detectJurisdiction({ text: "Invoice number 400051 relates to consulting." });
    expect(j.country).toBe("Unknown");
    expect(getJurisdictionFamily(j)).toBe("unknown");
  });

  it("Indian lease (non-employment) gets Indian law only, with no employment framing", async () => {
    const report = await orchestrateDocumentAnalysis(fixture("leave_and_licence_pune.txt"), "lease.txt");
    expect(report.metadata.documentType).toBe("lease_residential");
    expect(report.jurisdictionContext?.country).toBe("India");
    expect(report.jurisdictionContext?.stateOrUT).toBe("Maharashtra");
    expect(report.metadata.jurisdiction).toBe("India · Maharashtra");
    const blob = JSON.stringify(report);
    expect(blob).not.toMatch(/Delaware|Section 27|Percept|Copyright Act|post-employment|\bemployee\b/i);
    const sources = report.evidenceChains.flatMap((c) => c.legalSources.map((s) => s.citation));
    expect(sources.every((c) => /Indian Contract Act|Arbitration and Conciliation/.test(c))).toBe(true);
    expect(report.metadata.parties.map((p) => p.role)).toEqual(["Licensor", "Licensee"]);
  });

  it("UK services agreement receives no Indian or Delaware citations at all", async () => {
    const report = await orchestrateDocumentAnalysis(fixture("saas_services_uk.txt"), "saas.txt");
    expect(report.metadata.documentType).toBe("services_agreement");
    expect(report.jurisdictionContext?.country).toBe("United Kingdom");
    const blob = JSON.stringify(report);
    expect(blob).not.toMatch(/Indian Contract Act|Section 74|Section 27|Delaware|Restatement|Kailash/i);
    expect(report.evidenceChains.every((c) => c.legalSources.length === 0)).toBe(true);
    expect(report.evidenceChains.every((c) => c.verification.status === "insufficient_context")).toBe(true);
    // Currency and amounts are read as written, in the document's own currency.
    expect(report.financialTerms.some((t) => t.formattedAmount.startsWith("£48,000") && t.currency === "GBP")).toBe(true);
    expect(report.financialTerms.every((t) => !t.formattedAmount.endsWith(","))).toBe(true);
  });

  it("aiStatus honestly says deterministic when no key is configured", async () => {
    const report = await orchestrateDocumentAnalysis(fixture("saas_services_uk.txt"), "saas.txt");
    expect(report.aiStatus?.mode).toBe("deterministic");
  });

  it("the Delaware demo PDF still gets Delaware sources and correct parties", async () => {
    const buf = fs.readFileSync(path.join(__dirname, "..", "public", "employment_agreement_demo.pdf"));
    const report = await orchestrateDocumentAnalysis(buf, "employment_agreement_demo.pdf");
    expect(report.jurisdictionContext?.stateOrUT).toBe("Delaware");
    expect(report.metadata.parties.map((p) => p.name)).toEqual(["Aegis Cloud Dynamics Inc.", "Alex Morgan"]);
    const blob = JSON.stringify(report);
    expect(blob).not.toMatch(/Indian Contract Act|Section 74/i);
    // Financial terms are de-duplicated.
    const keys = report.financialTerms.map((t) => `${t.label}|${t.formattedAmount}`);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("risk findings never hardcode Indian law for a non-Indian document", () => {
    const clauses = [
      clause({ id: "c1", section: "Section 9", title: "Non-Compete", category: "restriction", rawText: "Employee shall not compete with the Employer for twelve (12) months." }),
    ];
    const us = identifyImportantClausesAndFindings({
      documentId: "d",
      clauses,
      documentType: "employment_agreement",
      jurisdiction: { country: "United States", stateOrUT: "Delaware", confidence: "high", source: "document" },
    });
    expect(JSON.stringify(us.findings)).not.toMatch(/Indian|Section 27|Section 74/);
    const unknown = identifyImportantClausesAndFindings({ documentId: "d", clauses, documentType: "employment_agreement" });
    expect(unknown.findings[0].whyItMatters).toMatch(/does not clearly establish/);
  });
});

// ────────────────────────────────────────────────────────────────────────────
describe("8. Demo bugs: chips, 'v.' truncation, duplicate action steps", () => {
  it("does not read 'rs,' out of ordinary words as a currency chip", () => {
    const report = { financialTerms: [], keyDates: [] } as unknown as AnalysisReport;
    const chip = extractStandoutValue(
      {
        id: "f",
        title: "Broad IP assignment captures personal creations and open-source work by users, 100 percent",
        description: "The clause covers works by contractors and hours 5 per week.",
        evidence: { quotedText: "All works, whether or not during working hours." },
      } as never,
      report
    );
    expect(chip ?? "").not.toMatch(/^rs/i);
  });

  it("still extracts real amounts", () => {
    expect(extractMoneyAmounts("pay ₹4,50,000 or Rs. 25,000 or $18,500 or INR 3 lakh").map((m) => m.raw)).toEqual([
      "₹4,50,000",
      "Rs. 25,000",
      "$18,500",
      "INR 3 lakh",
    ]);
    expect(extractDurations("sixty (60) calendar days and twelve (12) months")[1]).toMatchObject({ value: 12, unit: "month" });
  });

  it("keeps case citations and company abbreviations intact when splitting sentences", () => {
    const text = "Kailash Nath Associates v. Delhi Development Authority (2015) applies. Aegis Inc. shall pay the fee. Another sentence.";
    const parts = splitSentences(text);
    expect(parts[0]).toBe("Kailash Nath Associates v. Delhi Development Authority (2015) applies.");
    expect(parts[1]).toBe("Aegis Inc. shall pay the fee.");
    expect(parts).toHaveLength(3);
  });

  it("two restrictive findings produce distinct titles and no duplicate action steps", () => {
    const clauses = [
      clause({ id: "c9", section: "Section 9", title: "Post-Employment Restrictive Covenants", category: "restriction", rawText: "For twelve (12) months Employee shall not compete with the Employer anywhere." }),
      clause({ id: "c10", section: "Section 10", title: "Non-Solicitation", category: "restriction", rawText: "Employee shall not solicit any customer or employee of the Employer." }),
    ];
    const { findings } = identifyImportantClausesAndFindings({ documentId: "d", clauses, documentType: "employment_agreement" });
    expect(new Set(findings.map((f) => f.title)).size).toBe(findings.length);
    const full = findings.map((f, i) => ({ ...f, evidence: { findingId: f.id, documentId: "d", clauseId: f.clauseId, section: clauses[i].section, pageNumber: 1, quotedText: clauses[i].rawText } }));
    const plan = generateDeterministicActionPlan({ documentId: "d", documentSummary: "s", findings: full });
    const all = [...plan.urgentItems, ...plan.beforeSigning, ...plan.questionsToAsk, ...plan.documentsToCollect, ...plan.factsToConfirm, ...plan.followUpItems];
    const titles = all.map((i) => i.title.toLowerCase());
    expect(new Set(titles).size).toBe(titles.length);
  });

  it("the Ask view shows uncertainty and follow-up questions for every answer", async () => {
    const answer = await askLawPilot({ report: SAMPLE_ANALYSIS_REPORT, question: "What is my notice period?" });
    expect(answer.whatIsUncertain).toBeTruthy();
    expect(answer.whatWouldChangeAnswer?.length).toBeGreaterThan(0);
    expect(answer.followUpQuestions?.length).toBeGreaterThan(0);
  });
});

// ────────────────────────────────────────────────────────────────────────────
describe("4. Compare: direction, units, counts, matching", () => {
  const prev = clause({ id: "p", section: "Section 4", title: "Notice Period", category: "notice", rawText: "Either party shall give ninety (90) days written notice." });
  const curr = clause({ id: "c", section: "Section 4", title: "Notice Period", category: "notice", rawText: "Either party shall give sixty (60) days written notice." });

  it("a decrease is described as a decrease (never as increased / longer)", () => {
    const [change] = analyzeAllClauseDifferences(matchClausesSemantically([prev], [curr]), { isIndian: false, documentType: "services_agreement" });
    const d = change.semanticDetails!.find((x) => x.parameter === "Notice Period")!;
    expect(d.direction).toBe("decrease");
    expect(d.previousValue).toBe("90 days");
    expect(d.currentValue).toBe("60 days");
    expect(d.changeSummary).toContain("−30 days");
    expect(change.whyItMatters.toLowerCase()).toContain("shorter");
    expect(change.whyItMatters.toLowerCase()).not.toContain("longer notice");
  });

  it("compares durations in the same unit and reads written-out numbers", () => {
    const p = clause({ ...prev, rawText: "Employee shall not compete for twelve (12) months after termination." , category: "restriction", title: "Non-Compete" });
    const c = clause({ ...curr, rawText: "Employee shall not compete for two (2) years after termination.", category: "restriction", title: "Non-Compete" });
    const [change] = analyzeAllClauseDifferences(matchClausesSemantically([p], [c]), { isIndian: false, documentType: "employment_agreement" });
    const d = change.semanticDetails!.find((x) => x.parameter === "Restriction Duration")!;
    expect(d.previousValue).toBe("12 months");
    expect(d.currentValue).toBe("2 years");
    expect(d.direction).toBe("increase");
  });

  it("uses the document's own currency and correct sign for money", () => {
    const p = clause({ id: "p", title: "Rent", category: "payment", rawText: "The monthly rent payment is $2,000." });
    const c = clause({ id: "c", title: "Rent", category: "payment", rawText: "The monthly rent payment is $1,800." });
    const [change] = analyzeAllClauseDifferences(matchClausesSemantically([p], [c]), { isIndian: false, documentType: "lease_residential" });
    const d = change.semanticDetails![0];
    expect(d.previousValue).toBe("$2,000");
    expect(d.currentValue).toBe("$1,800");
    expect(d.changeSummary).toContain("−$200");
    expect(JSON.stringify(change)).not.toContain("₹");
    expect(change.whyItMatters).not.toMatch(/training|bond|employee/i);
  });

  it("does not pair unrelated payment clauses just because they share a category", () => {
    const rent = clause({ id: "p1", title: "Monthly Rent", category: "payment", rawText: "The tenant pays monthly rent of $2,000 on the first day of every month." });
    const deposit = clause({ id: "c1", title: "Security Deposit", category: "payment", rawText: "The landlord holds a refundable security deposit of $4,000 against damage." });
    const pairs = matchClausesSemantically([rent], [deposit]);
    expect(pairs.filter((p) => p.previousClause && p.currentClause)).toHaveLength(0);
    expect(pairs).toHaveLength(2);
  });

  it("assigns partners globally so order cannot steal a match", () => {
    const a = clause({ id: "a", title: "Confidentiality", category: "confidentiality", rawText: "Keep confidential information secret forever." });
    const b = clause({ id: "b", title: "Confidentiality Obligations", category: "confidentiality", rawText: "Keep confidential information secret." });
    const cur = clause({ id: "c", title: "Confidentiality Obligations", category: "confidentiality", rawText: "Keep confidential information secret." });
    const pairs = matchClausesSemantically([a, b], [cur]);
    const matched = pairs.find((p) => p.currentClause);
    expect(matched?.previousClause?.id).toBe("b");
  });

  it("swapping the flagship demo reverses direction", () => {
    const up = FLAGSHIP_DEMO_COMPARISON.changes.flatMap((c) => c.semanticDetails || []).find((d) => d.parameter === "Notice Period")!;
    const down = FLAGSHIP_DEMO_COMPARISON_SWAPPED.changes.flatMap((c) => c.semanticDetails || []).find((d) => d.parameter === "Notice Period")!;
    expect(up.direction).toBe("increase");
    expect(down.direction).toBe("decrease");
    expect(down.previousValue).toBe(up.currentValue);
    expect(FLAGSHIP_DEMO_COMPARISON_SWAPPED.previousDocument.fileName).toBe(FLAGSHIP_DEMO_COMPARISON.currentDocument.fileName);
  });

  it("Indian statutory commentary is not attached to a non-Indian comparison", () => {
    const j = compareJurisdictions(
      { country: "United Kingdom", confidence: "high", source: "document" },
      { country: "United Kingdom", confidence: "high", source: "document" }
    );
    const p = clause({ id: "p", title: "Liability", category: "liability", rawText: "Liability is capped at £10,000." });
    const c = clause({ id: "c", title: "Liability", category: "liability", rawText: "Liability is capped at £5,000." });
    const changes = integrateLegalContext(analyzeAllClauseDifferences(matchClausesSemantically([p], [c]), { isIndian: false }), j, "services_agreement");
    expect(changes.every((x) => !x.evidenceChain)).toBe(true);
    expect(j.statusLabel).toContain("United Kingdom");
  });

  it("summary counts agree between the headline, the list and the summary object", () => {
    const html = renderToString(
      React.createElement(ComparisonSummaryView, {
        summary: { ...FLAGSHIP_DEMO_COMPARISON.summary, materialChangesCount: 8 },
        jurisdictionComparison: FLAGSHIP_DEMO_COMPARISON.jurisdictionComparison,
        topMaterialChanges: FLAGSHIP_DEMO_COMPARISON.topMaterialChanges,
        onSelectChange: () => {},
      })
    ).replace(/<!--[\s\S]*?-->/g, "");
    expect(html).toContain("Showing the top 5 of 8 material changes");
    const s = FLAGSHIP_DEMO_COMPARISON.summary;
    expect(html).toContain(`${s.clausesChanged + s.clausesAdded + s.clausesRemoved + s.clausesMoved} total changes`);
  });

  it("does not hardcode 'India · Maharashtra' for a UK comparison", () => {
    const html = renderToString(
      React.createElement(ComparisonSummaryView, {
        summary: FLAGSHIP_DEMO_COMPARISON.summary,
        jurisdictionComparison: compareJurisdictions(
          { country: "United Kingdom", confidence: "high", source: "document" },
          { country: "United Kingdom", confidence: "high", source: "document" }
        ),
        topMaterialChanges: [],
        onSelectChange: () => {},
      })
    );
    expect(html).toContain("United Kingdom");
    expect(html).not.toContain("India · Maharashtra");
  });
});

// ────────────────────────────────────────────────────────────────────────────
describe("5. Ask LawPilot answers the selected clause / question from the report", () => {
  let report: AnalysisReport;
  beforeEach(async () => {
    report = await orchestrateDocumentAnalysis(fixture("leave_and_licence_pune.txt"), "lease.txt");
  });

  it("answers a specific factual question with the operative sentence and section", async () => {
    const answer = await askLawPilot({ report, question: "Who is responsible for pets?" });
    expect(answer.whatDocumentSays).toContain("pets");
    expect(answer.citations[0].sectionNumber).toMatch(/6/);
    expect(JSON.stringify(answer)).not.toMatch(/training|non-compete|notice period is 90/i);
  });

  it("answers about the deposit from the deposit clause, not an employment topic", async () => {
    const answer = await askLawPilot({ report, question: "Can the landlord keep my deposit?" });
    expect(answer.whatDocumentSays).toMatch(/deposit/i);
    expect(JSON.stringify(answer)).not.toMatch(/training bond|Section 27|employer/i);
  });

  it("says so plainly when the document does not address the question", async () => {
    const answer = await askLawPilot({ report, question: "What happens to the swimming pool maintenance schedule?" });
    expect(answer.confidence).toBe("insufficient");
    expect(answer.answer).toMatch(/couldn't find a clause/i);
    expect(answer.followUpQuestions?.length).toBeGreaterThan(0);
  });

  it("uses the selected finding as the clause in focus", async () => {
    const finding = report.findings.find((f) => /deposit/i.test(f.title))!;
    const answer = await askLawPilot({
      report,
      question: "What does this mean for me?",
      focus: { findingId: finding.id, clauseId: finding.clauseId },
    });
    expect(answer.whatDocumentSays).toMatch(/deposit/i);
  });

  it("never returns wrong-jurisdiction law: UK document answers carry no verified sources", async () => {
    const uk = await orchestrateDocumentAnalysis(fixture("saas_services_uk.txt"), "saas.txt");
    const answer = await askLawPilot({ report: uk, question: "Is the intellectual property assignment enforceable?" });
    expect(answer.sources).toHaveLength(0);
    expect(answer.legalContext).toMatch(/no verified legal source|could not establish/i);
    expect(JSON.stringify(answer)).not.toMatch(/Indian|Delaware/);
  });
});

// ────────────────────────────────────────────────────────────────────────────
describe("6. Situation Navigator uses the stated India / Maharashtra context", () => {
  it("landlord dispute in Pune gets Maharashtra concepts and no U.S. content", () => {
    const a = generateDeterministicSituationAssessment(
      "My landlord in Pune, Maharashtra has not returned my security deposit of ₹60,000 after I vacated the flat."
    );
    expect(a.identifiedCategory).toBe("landlord_tenant");
    expect(a.jurisdictionEstimate).toContain("India · Maharashtra");
    expect(a.relevantLegalConcepts.map((c) => c.concept).join(" ")).toContain("Maharashtra Rent Control Act");
    expect(JSON.stringify(a)).not.toMatch(/\$\d|FMLA|U\.S\.|small claims|certified mail/i);
  });

  it("Indian unpaid invoice does not get U.S. small-claims caps or dollar costs", () => {
    const a = generateDeterministicSituationAssessment(
      "A client in Bengaluru has not paid my invoice of ₹1,50,000 for 60 days after I delivered the work."
    );
    expect(a.identifiedCategory).toBe("freelance_unpaid_invoice");
    expect(a.jurisdictionEstimate).toContain("Karnataka");
    expect(JSON.stringify(a)).not.toMatch(/\$|small claims|ACH|attorneys' fee/i);
  });

  it("an unlocated dispute stays jurisdiction-neutral and asks where it happened", () => {
    const a = generateDeterministicSituationAssessment("My employer terminated me and is holding my final salary.");
    expect(a.jurisdictionEstimate).toMatch(/Not stated/);
    expect(a.followUpQuestions[0].question).toMatch(/country and state or city/i);
    expect(JSON.stringify(a)).not.toMatch(/at-will|FMLA|\$\d/i);
  });

  it("classifies with word boundaries ('current' is not 'rent')", () => {
    const a = generateDeterministicSituationAssessment("My current employer terminated me last week without notice.");
    expect(a.identifiedCategory).toBe("employment_dispute");
  });

  it("keeps the U.S. profile when the user is in the U.S.", () => {
    const a = generateDeterministicSituationAssessment(
      "I am an independent contractor in Texas. A client in California has not paid an invoice of $14,500."
    );
    expect(a.identifiedCategory).toBe("freelance_unpaid_invoice");
    expect(JSON.stringify(a)).toMatch(/\$/);
  });
});

// ────────────────────────────────────────────────────────────────────────────
describe("7. Document Passage: quote highlighting survives line breaks and selection changes", () => {
  const clauses: Clause[] = [
    clause({ id: "a", section: "Section 1", title: "First", category: "general", rawText: "First clause text." }),
    clause({
      id: "b",
      section: "Section 2",
      title: "Second",
      category: "restriction",
      pageNumber: 2,
      rawText: "The Employee shall not,\nwithin fifty miles,\ncompete with the Employer.",
    }),
  ];

  it("highlights the evidence quote even when the clause has hard line breaks", () => {
    const html = renderToString(
      React.createElement(DocumentViewer, {
        clauses,
        selectedClauseId: "b",
        activeEvidenceLink: {
          findingId: "f",
          documentId: "d",
          clauseId: "b",
          pageNumber: 2,
          section: "Section 2",
          quotedText: "shall not, within fifty miles,",
        },
        documentTitle: "Doc",
        totalPageCount: 2,
      })
    ).replace(/<!--[\s\S]*?-->/g, "");
    expect(html).toMatch(/<mark[^>]*>shall not,\nwithin fifty miles,<\/mark>/);
    expect(html).toContain("Page 2 of 2");
  });

  it("follows the selected clause's page instead of sticking to an old page", () => {
    const html = renderToString(
      React.createElement(DocumentViewer, { clauses, selectedClauseId: "a", documentTitle: "Doc", totalPageCount: 2 })
    ).replace(/<!--[\s\S]*?-->/g, "");
    expect(html).toContain("Page 1 of 2");
  });
});
