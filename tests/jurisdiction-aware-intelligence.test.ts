import { describe, it, expect } from "vitest";
import {
  detectJurisdiction,
  applyUserJurisdictionOverride,
  formatJurisdictionBadge,
  isIndianJurisdiction,
} from "@/lib/jurisdiction/jurisdictionDetector";
import {
  buildPreciseResearchQuestion,
} from "@/lib/ai/prompts/legalResearch";
import {
  performLegalResearch,
  answerClauseQuestion,
  DEMO_VERIFIED_INDIAN_LEGAL_SOURCES,
} from "@/lib/ai/agents/legalResearchAgent";
import {
  generateDeterministicLawyerBrief,
} from "@/lib/ai/agents/lawyerBriefAgent";
import {
  SAMPLE_DOCUMENT_METADATA,
  SAMPLE_FINANCIAL_TERMS,
  SAMPLE_KEY_DATES,
  SAMPLE_CLAUSES,
  SAMPLE_FINDINGS,
  SAMPLE_EVIDENCE_CHAINS,
  SAMPLE_ACTION_PLAN,
  SAMPLE_DETAILED_LAWYER_BRIEF,
} from "@/lib/demo/sampleAnalysis";
import { compareSourcePriority } from "@/lib/safety/legalSourceValidator";
import type { LegalSource } from "@/types";

describe("Phase 5: Jurisdiction-Aware Legal Intelligence + India-First Demo", () => {
  // Test 1: Extraction of India + Maharashtra from governing law & venue clauses
  it("1. extracts India and Maharashtra from explicit choice-of-law and Mumbai venue clauses", () => {
    const text = `
      SECTION 12. GOVERNING LAW AND JURISDICTION
      This Agreement shall be governed exclusively by the laws of the Republic of India.
      The competent courts in Mumbai, Maharashtra shall have exclusive jurisdiction over any disputes.
    `;
    const result = detectJurisdiction({ text });
    expect(result.country).toBe("India");
    expect(result.stateOrUT).toBe("Maharashtra");
    expect(result.confidence).toBe("high");
    expect(result.source).toBe("document");
    expect(result.evidence?.some((e) => e.includes("governed exclusively by the laws of the Republic of India"))).toBe(true);
    expect(result.evidence?.some((e) => e.toLowerCase().includes("mumbai"))).toBe(true);
  });

  // Test 2: Extraction of jurisdiction from Indian PIN code & corporate address recitals
  it("2. infers Indian state from 6-digit postal code (PIN) and corporate address", () => {
    const text = `
      This Agreement is entered into by Kavach Dynamics Technologies Private Limited,
      having its registered office at Platina Tower, BKC, Bandra (East), Mumbai 400051.
    `;
    const result = detectJurisdiction({ text });
    expect(result.country).toBe("India");
    expect(result.stateOrUT).toBe("Maharashtra");
    expect(result.evidence?.some((e) => e.includes("400051"))).toBe(true);
  });

  // Test 3: Ambiguity handling when contract text is silent or conflicting
  it("3. surfaces ambiguity warnings when jurisdiction signals are conflicting or absent", () => {
    // A. Silent document
    const silentResult = detectJurisdiction({ text: "Standard terms and conditions for consulting services." });
    expect(silentResult.country).toBe("Unknown");
    expect(silentResult.confidence).toBe("unknown");
    expect(silentResult.ambiguityWarnings?.length).toBeGreaterThan(0);

    // B. Conflicting signals (mentions Indian Contract Act and Delaware law)
    const conflictingText = `
      Governed by the laws of the State of Delaware.
      However, disputes shall reference the Indian Contract Act, 1872.
    `;
    const conflictResult = detectJurisdiction({ text: conflictingText });
    expect(conflictResult.ambiguityWarnings?.some((w) => w.includes("conflicting"))).toBe(true);
  });

  // Test 4: User manual override takes precedence over inference
  it("4. user manual override takes precedence over inferred or document jurisdiction", () => {
    const initial = detectJurisdiction({ text: "Consulting agreement without specific jurisdiction clause." });
    expect(initial.source).not.toBe("user");

    const overridden = applyUserJurisdictionOverride(initial, {
      country: "India",
      stateOrUT: "Maharashtra",
      governingLaw: "Laws of India",
    });

    expect(overridden.country).toBe("India");
    expect(overridden.stateOrUT).toBe("Maharashtra");
    expect(overridden.governingLaw).toBe("Laws of India");
    expect(overridden.confidence).toBe("high");
    expect(overridden.source).toBe("user");
    expect(overridden.evidence?.[0]).toContain("User manual override applied: India · Maharashtra");
  });

  // Test 5: India research routing formulates Section 27 and Section 74 research questions
  it("5. generates precise Indian statutory research questions for non-compete and training bond", () => {
    const nonCompeteQ = buildPreciseResearchQuestion(
      "12-month post-employment restriction",
      "restriction",
      "Employee shall not engage in competing business",
      "India · Maharashtra"
    );
    expect(nonCompeteQ).toContain("Section 27 of the Indian Contract Act, 1872");
    expect(nonCompeteQ).toContain("Percept D'Mark");
    expect(nonCompeteQ).toContain("void ab initio");

    const bondQ = buildPreciseResearchQuestion(
      "Early departure training reimbursement",
      "payment",
      "Employee shall repay ₹4,50,000",
      "India"
    );
    expect(bondQ).toContain("Section 74 of the Indian Contract Act, 1872");
    expect(bondQ).toContain("Fateh Chand");
  });

  // Test 6: Authoritative Indian legal source repository and hierarchy
  it("6. routes to authoritative Indian legal repository and respects source hierarchy", async () => {
    const research = await performLegalResearch({
      findingTitle: "Early departure training bond reimbursement",
      category: "payment",
      clauseText: "Employee must repay ₹4,50,000 if leaving within 18 months",
      jurisdiction: "India · Maharashtra",
    });

    expect(research.jurisdiction).toBe("India · Maharashtra");
    expect(research.sources.length).toBeGreaterThan(0);
    expect(research.sources.some((s) => s.citation.includes("Indian Contract Act, 1872 § 74"))).toBe(true);

    // Verify source hierarchy: Legislation (India Code) before Court Decisions
    const sources: LegalSource[] = [
      DEMO_VERIFIED_INDIAN_LEGAL_SOURCES.training_reimbursement[1], // Court (Kailash Nath)
      DEMO_VERIFIED_INDIAN_LEGAL_SOURCES.training_reimbursement[0], // Legislation (ICA § 74)
    ];
    sources.sort(compareSourcePriority);
    expect(sources[0].sourceType).toBe("official_legislation");
    expect(sources[1].sourceType).toBe("official_court");
  });

  // Test 7: Claim calibration avoids absolutist "illegal" assertions and states factual dependencies
  it("7. calibrates Indian legal claims with non-absolutist language and factual dependencies", async () => {
    const research = await performLegalResearch({
      findingTitle: "12-month post-employment non-compete covenant",
      category: "restriction",
      clauseText: "Employee shall not work for any competitor across India for 12 months",
      jurisdiction: "India",
    });

    const claims = research.claims;
    expect(claims.length).toBeGreaterThan(0);
    claims.forEach((c) => {
      expect(c.claim.toLowerCase()).not.toContain("this clause is illegal");
      expect(c.uncertainties.length).toBeGreaterThan(0);
      expect(c.jurisdiction).toBe("India");
      expect(c.verified).toBe(true);
    });
  });

  // Test 8: Prevention of Delaware leakage into the flagship India demo
  it("8. guarantees zero Delaware or US leakage into the flagship India demo analysis", () => {
    // 1. Metadata
    const metaStr = JSON.stringify(SAMPLE_DOCUMENT_METADATA);
    expect(metaStr).not.toContain("Delaware");
    expect(metaStr).not.toContain("Aegis Cloud Dynamics");
    expect(metaStr).not.toContain("Alex Morgan");
    expect(SAMPLE_DOCUMENT_METADATA.parties[0].name).toBe("Kavach Dynamics Technologies Private Limited");
    expect(SAMPLE_DOCUMENT_METADATA.parties[1].name).toBe("Rohan Sharma");

    // 2. Financial Terms (INR ₹ only)
    const finStr = JSON.stringify(SAMPLE_FINANCIAL_TERMS);
    expect(finStr).not.toContain("$18,500");
    expect(finStr).not.toContain("$145,000");
    expect(finStr).not.toContain("USD");
    expect(SAMPLE_FINANCIAL_TERMS[0].formattedAmount).toBe("₹32,00,000 / year");
    expect(SAMPLE_FINANCIAL_TERMS[1].formattedAmount).toBe("₹4,50,000");

    // 3. Detailed Lawyer Brief
    const briefStr = JSON.stringify(SAMPLE_DETAILED_LAWYER_BRIEF);
    expect(briefStr).not.toContain("Delaware");
    expect(briefStr).not.toContain("19 Del. C.");
    expect(briefStr).not.toContain("Kodiak Bldg. Partners");
    expect(briefStr).not.toContain("Aegis");
    expect(briefStr).not.toContain("Alex Morgan");
    expect(briefStr).toContain("Kavach Dynamics Technologies Private Limited");
    expect(briefStr).toContain("Rohan Sharma");
    expect(briefStr).toContain("Indian Contract Act, 1872");
    expect(briefStr).toContain("Mumbai");

    // 4. Action Plan
    const actionStr = JSON.stringify(SAMPLE_ACTION_PLAN);
    expect(actionStr).not.toContain("Delaware");
    expect(actionStr).not.toContain("Alex Morgan");
    expect(actionStr).toContain("Rohan Sharma");
    expect(actionStr).toContain("Kavach Dynamics");
  });

  // Test 9: Evidence Chain contains India jurisdiction metadata
  it("9. validates EvidenceChain jurisdiction metadata and Indian legal linkages", () => {
    const chain = SAMPLE_EVIDENCE_CHAINS[0];
    expect(chain.jurisdictionContext?.country).toBe("India");
    expect(chain.jurisdictionContext?.stateOrUT).toBe("Maharashtra");
    expect(formatJurisdictionBadge(chain.jurisdictionContext)).toBe("India · Maharashtra");

    // Check legal authorities in the chains
    const allSources = SAMPLE_EVIDENCE_CHAINS.flatMap((c) => c.legalSources);
    const titles = allSources.map((s) => s.title);
    expect(titles.some((t) => t.includes("Indian Contract Act, 1872 § 74"))).toBe(true);
    expect(titles.some((t) => t.includes("Indian Contract Act, 1872 § 27"))).toBe(true);
    expect(titles.some((t) => t.includes("Copyright Act, 1957 § 17(c)"))).toBe(true);
    expect(titles.some((t) => t.includes("Arbitration and Conciliation Act, 1996"))).toBe(true);
  });

  // Test 10: 5-Part Calibrated User Q&A for Indian Training Bond
  it("10. provides calibrated 5-part response for Indian training bond question without absolutism", async () => {
    const clause = SAMPLE_CLAUSES.find((c) => c.id === "clause-sec-6")!;
    const finding = SAMPLE_FINDINGS.find((f) => f.clauseId === "clause-sec-6")!;
    const chain = SAMPLE_EVIDENCE_CHAINS.find((c) => c.finding.clauseId === "clause-sec-6")!;
    const answer = await answerClauseQuestion(
      {
        documentId: "demo-employment-agreement",
        clauseId: "clause-sec-6",
        question: "Can Kavach Dynamics definitely charge me ₹4,50,000 if I leave early?",
        jurisdiction: "India · Maharashtra",
      },
      finding,
      clause,
      chain.legalSources
    );

    // Everything is derived from the supplied clause, finding and verified sources.
    expect(answer.whatContractSays).toContain("4,50,000");
    expect(answer.whatContractSays).toContain("Section 6");
    expect(answer.legalContext).toContain("Indian Contract Act, 1872 § 74");
    expect(answer.legalContext).toContain("Kailash Nath Associates");
    expect(answer.legalContext).toContain("ceiling");
    expect(answer.whatThisMeans).toBe(finding.whyItMatters);
    expect(answer.whatWeCannotDetermine).toContain("LawPilot cannot definitively determine");
    expect(answer.nextStep).toContain("clarify");
    expect(answer.confidence).toBe("moderate");

    // Without a clause there is nothing to quote: it must say so, never invent a bond narrative.
    const noClause = await answerClauseQuestion({
      documentId: "demo-employment-agreement",
      clauseId: "clause-sec-6",
      question: "Can Kavach Dynamics definitely charge me ₹4,50,000 if I leave early?",
      jurisdiction: "India · Maharashtra",
    });
    expect(noClause.whatContractSays).not.toContain("4,50,000");
    expect(noClause.confidence).toBe("insufficient");
  });

  // Test 11: Lawyer Brief generation dynamically synthesizes Indian legal context
  it("11. generateDeterministicLawyerBrief synthesizes Indian legal context for India jurisdiction", () => {
    const brief = generateDeterministicLawyerBrief({
      documentId: "test-doc-india",
      documentTitle: "Executive Employment Agreement",
      documentType: "employment_agreement",
      parties: ["Kavach Dynamics Technologies Pvt. Ltd.", "Rohan Sharma"],
      jurisdiction: "India · Maharashtra",
      documentSummary: "Employment agreement governed by Indian law with Mumbai courts venue.",
      findings: SAMPLE_FINDINGS,
      clauses: SAMPLE_CLAUSES,
      evidenceChains: SAMPLE_EVIDENCE_CHAINS,
      keyDates: SAMPLE_KEY_DATES,
    });

    expect(brief.verifiedLegalContext.length).toBeGreaterThan(0);
    const citations = brief.verifiedLegalContext.map((c) => c.citation);
    expect(citations.some((c) => c.includes("Indian Contract Act, 1872 § 74"))).toBe(true);
    expect(citations.some((c) => c.includes("Indian Contract Act, 1872 § 27"))).toBe(true);
    expect(citations.some((c) => c.includes("19 Del. C."))).toBe(false);
  });

  // Test 12: Helper function isIndianJurisdiction detects variations
  it("12. validates isIndianJurisdiction with multiple regional and string inputs", () => {
    expect(isIndianJurisdiction({ country: "India", confidence: "high", source: "document" })).toBe(true);
    expect(isIndianJurisdiction("India · Maharashtra")).toBe(true);
    expect(isIndianJurisdiction("Mumbai, Maharashtra, India")).toBe(true);
    expect(isIndianJurisdiction("Bengaluru, Karnataka")).toBe(true);
    expect(isIndianJurisdiction("State of Delaware")).toBe(false);
    expect(isIndianJurisdiction("United States")).toBe(false);
  });
});
