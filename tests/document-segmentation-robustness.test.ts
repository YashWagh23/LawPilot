import { describe, it, expect } from "vitest";
import fs from "fs";
import { extractDocumentContent } from "@/lib/documents/textExtractor";
import { normalizeDocumentContent } from "@/lib/documents/documentNormalizer";
import {
  segmentDocumentIntoClauses,
} from "@/lib/documents/clauseSegmenter";
import { orchestrateDocumentAnalysis } from "@/lib/analysis/analysisOrchestrator";
import { getAnalysisReportById } from "@/lib/firebase/firestore";
import { SAMPLE_ANALYSIS_REPORT } from "@/lib/demo/sampleAnalysis";
import path from "path";

const localFixturePath = path.resolve(__dirname, "fixtures", "LawPilot_Test_Employment_Agreement.pdf");
const fallbackPath = path.resolve(process.cwd(), "tests", "fixtures", "LawPilot_Test_Employment_Agreement.pdf");
const pdfPath = fs.existsSync(localFixturePath) ? localFixturePath : fallbackPath;

describe("Document Segmentation Robustness & Real PDF Regression Suite", () => {
  // Test 1: Real PDF Full Pipeline & Clause Segmentation
  it("segments the real test PDF into 15+ substantive clauses across all 4 pages", async () => {
    const buffer = fs.readFileSync(pdfPath);
    const extracted = await extractDocumentContent(buffer, "pdf");
    expect(extracted.totalPageCount).toBe(4);

    const normalized = normalizeDocumentContent(extracted.rawText, extracted.pages);
    const clauses = segmentDocumentIntoClauses(
      normalized.normalizedFullText,
      normalized.normalizedPages,
      "test-real-pdf"
    );

    // Verify clause count is multiple substantive clauses (not collapsed into 1!)
    expect(clauses.length).toBeGreaterThanOrEqual(15);

    // Verify key section presence
    const sections = clauses.map((c) => ({
      section: c.section,
      title: c.title,
      page: c.pageNumber,
    }));

    // Check individual section coverage
    const s1 = sections.find((s) => s.title.includes("Appointment"));
    expect(s1).toBeDefined();
    expect(s1?.page).toBe(1);

    const s2 = sections.find((s) => s.title.includes("Compensation"));
    expect(s2).toBeDefined();
    expect(s2?.page).toBe(1);

    const s5 = sections.find((s) => s.title.includes("Notice Period"));
    expect(s5).toBeDefined();
    expect(s5?.page).toBe(2);

    const s6 = sections.find((s) => s.title.includes("Training"));
    expect(s6).toBeDefined();
    expect(s6?.page).toBe(2);

    const s7 = sections.find((s) => s.title.includes("Confidentiality"));
    expect(s7).toBeDefined();
    expect(s7?.page).toBe(2);

    const s8 = sections.find((s) => s.title.includes("Intellectual Property"));
    expect(s8).toBeDefined();
    expect(s8?.page).toBe(3);

    const s9 = sections.find((s) => s.title.includes("Post-Employment"));
    expect(s9).toBeDefined();
    expect(s9?.page).toBe(3);

    const s11 = sections.find((s) => s.title.includes("Dispute Resolution") || s.title.includes("Arbitration"));
    expect(s11).toBeDefined();
    expect(s11?.page).toBe(3);

    const s12 = sections.find((s) => s.title.includes("Governing Law"));
    expect(s12).toBeDefined();
    expect(s12?.page).toBe(3);

    const s13 = sections.find((s) => s.title.includes("Company Policies"));
    expect(s13).toBeDefined();
    expect(s13?.page).toBe(4);

    const s14 = sections.find((s) => s.title.includes("Entire Agreement"));
    expect(s14).toBeDefined();
    expect(s14?.page).toBe(4);

    const exA = sections.find((s) => s.section.includes("Exhibit A"));
    expect(exA).toBeDefined();
    expect(exA?.page).toBe(4);
  });

  // Test 2: Real PDF End-to-End Orchestration & Substantive Findings
  it("orchestrates real PDF producing substantive findings without false preamble obligations", async () => {
    const buffer = fs.readFileSync(pdfPath);
    const report = await orchestrateDocumentAnalysis(
      buffer,
      "LawPilot_Test_Employment_Agreement.pdf"
    );

    expect(report.metadata.pageCount).toBe(4);
    expect(report.clauses.length).toBeGreaterThanOrEqual(15);
    expect(report.findings.length).toBeGreaterThanOrEqual(4);

    // Confirm that the buggy finding "Recitals and Preamble creates potential exit financial obligation" is NOT present
    const preambleFinding = report.findings.find((f) => f.title.includes("Recitals and Preamble"));
    expect(preambleFinding).toBeUndefined();

    // Confirm real findings are attributed to correct clauses
    const trainingFinding = report.findings.find((f) => f.title.includes("Training"));
    expect(trainingFinding).toBeDefined();
    expect(trainingFinding?.evidence?.pageNumber).toBe(2);

    const nonCompeteFinding = report.findings.find((f) => f.title.includes("Post-employment") || f.title.includes("restrictive covenant"));
    expect(nonCompeteFinding).toBeDefined();
    expect(nonCompeteFinding?.evidence?.pageNumber).toBe(3);

    const noticeFinding = report.findings.find((f) => f.title.includes("notice period"));
    expect(noticeFinding).toBeDefined();
    expect(noticeFinding?.evidence?.pageNumber).toBe(2);
  });

  // Test 3: Diverse Heading Patterns in Plain Text (TXT)
  it("segments plain text contracts using varied heading formats", () => {
    const txtContent = `
EMPLOYMENT AGREEMENT

This Agreement is made between TechCorp India and Rohan Verma.

SECTION 1 — APPOINTMENT
The Company hereby employs the Employee as Principal Architect.

2. COMPENSATION AND ALLOWANCES
The Employee shall receive base salary of INR 45,00,000 per annum.

Article III: Notice Period
Either party may terminate by giving 60 calendar days written notice.

4) Training Bond
If external certification exceeds INR 2,00,000, Employee agrees to repay upon early departure.

CONFIDENTIALITY
The Employee agrees to keep all trade secrets confidential.

Exhibit A - Scope of Inventions
Itemized listing of pre-existing intellectual property.
`.trim();

    const clauses = segmentDocumentIntoClauses(txtContent, [], "test-txt-doc");
    expect(clauses.length).toBeGreaterThanOrEqual(6);

    const titles = clauses.map((c) => c.title);
    expect(titles.some((t) => t.includes("APPOINTMENT"))).toBe(true);
    expect(titles.some((t) => t.includes("COMPENSATION"))).toBe(true);
    expect(titles.some((t) => t.includes("Notice Period"))).toBe(true);
    expect(titles.some((t) => t.includes("Training Bond"))).toBe(true);
    expect(titles.some((t) => t.includes("Confidentiality") || t.includes("CONFIDENTIALITY"))).toBe(true);
    expect(titles.some((t) => t.includes("Scope of Inventions") || t.includes("Inventions"))).toBe(true);
  });

  // Test 4: Two-line Headings & Inline Headings
  it("handles two-line headings and inline heading + body on same line", () => {
    const textWithSpecialHeadings = `
Section 1
Scope of Services
The Contractor shall provide cloud migration engineering services.

2. Term and Renewal. This Agreement commences on the Effective Date and continues for twelve months unless terminated earlier.

3) Governing Law
This Agreement is governed by the laws of India.
`.trim();

    const clauses = segmentDocumentIntoClauses(textWithSpecialHeadings, [], "test-special-headings");
    expect(clauses.length).toBe(3);

    const s1 = clauses.find((c) => c.section === "Section 1");
    expect(s1?.title).toBe("Scope of Services");
    expect(s1?.rawText).toContain("The Contractor shall provide");

    const s2 = clauses.find((c) => c.section === "Section 2");
    expect(s2?.title).toBe("Term and Renewal");
    expect(s2?.rawText).toContain("This Agreement commences on the Effective Date");

    const s3 = clauses.find((c) => c.section === "Section 3");
    expect(s3?.title).toBe("Governing Law");
  });

  // Test 5: Existing Curated Demo Integrity
  it("preserves 100% integrity of the flagship India demo report", async () => {
    const report = await getAnalysisReportById("demo-employment-agreement");
    expect(report).not.toBeNull();
    expect(report?.id).toBe("demo-employment-agreement");
    expect(report?.metadata.title).toContain("Employment");
    expect(report?.jurisdiction?.country).toBe("India");
    expect(report?.clauses.length).toBeGreaterThanOrEqual(8);
    expect(report?.findings.length).toBeGreaterThanOrEqual(4);
    expect(report?.evidenceChains.length).toBeGreaterThanOrEqual(4);
    expect(SAMPLE_ANALYSIS_REPORT.clauses.length).toBeGreaterThanOrEqual(8);
  });
});
