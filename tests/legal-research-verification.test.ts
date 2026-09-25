import { describe, it, expect } from "vitest";
import {
  validateLegalSource,
  validateLegalClaim,
  isSourceStale,
  compareSourcePriority,
} from "@/lib/safety/legalSourceValidator";
import {
  runHardVerificationGate,
  calibrateLegalLanguage,
  verifyAndAssembleEvidence,
} from "@/lib/ai/agents/verificationAgent";
import {
  performLegalResearch,
  answerClauseQuestion,
  DEMO_VERIFIED_LEGAL_SOURCES,
} from "@/lib/ai/agents/legalResearchAgent";
import {
  SAMPLE_CLAUSES,
  SAMPLE_FINDINGS,
  SAMPLE_EVIDENCE_CHAINS,
} from "@/lib/demo/sampleAnalysis";
import type { Clause, Finding, LegalClaim, LegalSource } from "@/types";

describe("Phase 3: Legal Research & Verified Evidence Chain", () => {
  const validSource: LegalSource = {
    id: "src-valid-1",
    title: "Delaware Wage Payment and Collection Act",
    publisher: "Delaware General Assembly",
    sourceType: "official_legislation",
    jurisdiction: "Delaware",
    citation: "19 Del. C. § 1107",
    url: "https://delcode.delaware.gov/title19/c011/index.html",
    relevance: "Governs mandatory deductions and wage withholding",
    retrievedAt: new Date().toISOString(),
    verificationStatus: "verified",
    excerpt: "No employer may withhold or divert any portion of an employee's wages.",
  };

  // Test 1: Authoritative source accepted
  it("1. accepts authoritative official legislation source", () => {
    const result = validateLegalSource(validSource);
    expect(result.isValid).toBe(true);
    expect(result.issues).toHaveLength(0);
    expect(result.data?.citation).toBe("19 Del. C. § 1107");
  });

  // Test 2: Unsupported source rejected (e.g. unverified or empty)
  it("2. rejects unsupported / unverified model knowledge as legal authority", () => {
    const unverifiedSource: Partial<LegalSource> = {
      ...validSource,
      sourceType: "unverified",
    };
    const result = validateLegalSource(unverifiedSource);
    expect(result.isValid).toBe(false);
    expect(result.issues.some((i) => i.includes("Model internal knowledge"))).toBe(true);
  });

  // Test 3: Fabricated citation rejected
  it("3. rejects placeholder or evasive citation", () => {
    const evasiveSource: Partial<LegalSource> = {
      ...validSource,
      citation: "citation needed",
    };
    const result = validateLegalSource(evasiveSource);
    expect(result.isValid).toBe(false);
    expect(result.issues.some((i) => i.includes("Placeholder or evasive"))).toBe(true);
  });

  // Test 4: Invalid URL rejected
  it("4. rejects invalid or non-http URLs", () => {
    const invalidUrlSource: Partial<LegalSource> = {
      ...validSource,
      url: "javascript:alert(1)",
    };
    const result = validateLegalSource(invalidUrlSource);
    expect(result.isValid).toBe(false);
    expect(result.issues.some((i) => i.includes("http or https"))).toBe(true);
  });

  // Test 5: Wrong jurisdiction rejected
  it("5. rejects legal claim referencing wrong jurisdiction", () => {
    const californiaClaim: LegalClaim = {
      id: "claim-california",
      findingId: "f-1",
      claim: "Under California law, all non-competes are void.",
      sourceIds: [validSource.id], // Delaware source
      supportLevel: "direct",
      explanation: "Cal. Bus. & Prof. Code § 16600 applies.",
      uncertainties: [],
      jurisdiction: "California",
      verified: false,
    };
    const result = validateLegalClaim(californiaClaim, [validSource]);
    expect(result.isValid).toBe(false);
    expect(result.issues.some((i) => i.includes("does not match jurisdiction"))).toBe(true);
  });

  // Test 6: Partially supporting source downgraded
  it("6. downgrades direct support to strong when relying on secondary sources", () => {
    const secondarySource: LegalSource = {
      ...validSource,
      id: "sec-src-1",
      sourceType: "secondary_source",
    };
    const claim: LegalClaim = {
      id: "claim-sec",
      findingId: "f-1",
      claim: "Secondary treatises suggest reasonable notice periods.",
      sourceIds: ["sec-src-1"],
      supportLevel: "direct",
      explanation: "Treatise commentary supports this position.",
      uncertainties: [],
      jurisdiction: "Delaware",
      verified: false,
    };
    const result = validateLegalClaim(claim, [secondarySource]);
    expect(result.isValid).toBe(true);
    expect(result.data?.supportLevel).toBe("strong");
  });

  // Test 7: Conflicting sources handled
  it("7. detects and reports conflicting legal sources", () => {
    const sourceProhibiting: LegalSource = {
      ...validSource,
      id: "src-prohibit",
      excerpt: "Post-employment covenants are strictly prohibited and void under all conditions.",
    };
    const sourceEnforcing: LegalSource = {
      ...validSource,
      id: "src-enforce",
      title: "Reasonableness Authority",
      citation: "Del. Precedent",
      excerpt: "Restrictive covenants are enforceable if reasonable in geographic duration.",
    };
    const finding = SAMPLE_FINDINGS[3];
    const clause = SAMPLE_CLAUSES[8];
    const dummyClaim: LegalClaim = {
      id: "claim-conflict",
      findingId: finding.id,
      claim: "Covenants may face enforceability challenges.",
      sourceIds: ["src-prohibit", "src-enforce"],
      supportLevel: "context_dependent",
      explanation: "Doctrines diverge.",
      uncertainties: [],
      jurisdiction: "Delaware",
      verified: true,
    };

    const result = runHardVerificationGate(
      finding,
      clause,
      [dummyClaim],
      [sourceProhibiting, sourceEnforcing],
      "Delaware"
    );

    expect(result.conflictDetected).toBe(true);
    expect(result.status).toBe("conflicting");
    expect(result.conflictDetails?.description).toContain("Sources differ on this issue");
  });

  // Test 8: Missing jurisdiction handled
  it("8. handles missing or unknown jurisdiction gracefully", async () => {
    const result = await performLegalResearch({
      findingTitle: "Arbitration fee waiver",
      category: "dispute_resolution",
      clauseText: "Each party shall pay equal fees.",
      jurisdiction: "",
    });

    expect(result.researchConfidence).toBe("insufficient");
    expect(result.error).toBe("Jurisdiction required for reliable legal verification.");
    expect(result.sources).toHaveLength(0);
  });

  // Test 9: Model-only legal claim rejected
  it("9. rejects legal claim based solely on model knowledge without sources", () => {
    const modelOnlyClaim: LegalClaim = {
      id: "claim-model-only",
      findingId: "f-1",
      claim: "The model believes this clause is illegal under common sense.",
      sourceIds: [],
      supportLevel: "direct",
      explanation: "No source cited.",
      uncertainties: [],
      jurisdiction: "Delaware",
      verified: false,
    };
    const result = validateLegalClaim(modelOnlyClaim, []);
    expect(result.isValid).toBe(false);
    expect(result.issues.some((i) => i.includes("no linked authoritative sources"))).toBe(true);
  });

  // Test 10: Legal claim with non-existent source rejected
  it("10. rejects legal claim with missing or unresolvable source IDs", () => {
    const claimWithGhostSource: LegalClaim = {
      id: "claim-ghost",
      findingId: "f-1",
      claim: "Arbitration rules override fee allocations.",
      sourceIds: ["ghost-id-999"],
      supportLevel: "direct",
      explanation: "Ghost authority.",
      uncertainties: [],
      jurisdiction: "Delaware",
      verified: false,
    };
    const result = validateLegalClaim(claimWithGhostSource, [validSource]);
    expect(result.isValid).toBe(false);
    expect(result.issues.some((i) => i.includes("None of the claimed source IDs correspond"))).toBe(true);
  });

  // Test 11: Document evidence linked correctly
  it("11. links document evidence with clause and verbatim quote", () => {
    const chain = SAMPLE_EVIDENCE_CHAINS[0];
    expect(chain.documentEvidence.clauseId).toBe("clause-sec-6");
    expect(chain.documentEvidence.section).toBe("Section 6");
    expect(chain.documentEvidence.pageNumber).toBe(2);
    expect(chain.documentEvidence.quotedText).toMatch(/4,50,000|\$18,500/);
  });

  // Test 12: Evidence Chain contains all 7 required layers
  it("12. verifies that EvidenceChain contains all required architecture layers", () => {
    const chain = SAMPLE_EVIDENCE_CHAINS[0];
    // Layer 1: Finding
    expect(chain.finding).toBeDefined();
    // Layer 2: Document Evidence
    expect(chain.documentEvidence.sourceType).toBe("document");
    // Layer 3: Legal Claims
    expect(chain.legalClaims.length).toBeGreaterThan(0);
    // Layer 4: Legal Sources
    expect(chain.legalSources.length).toBeGreaterThan(0);
    // Layer 5: Verification Details
    expect(chain.verification.status).toBe("verified");
    expect(chain.verification.confidenceLevel).toBe("high");
    // Layer 6: Uncertainties
    expect(chain.uncertainties.length).toBeGreaterThan(0);
    // Layer 7: Practical Next Steps
    expect(chain.nextSteps.length).toBeGreaterThan(0);
  });

  // Test 13: Demo research renders correctly for all 4 primary findings
  it("13. renders verified demo research for all 4 primary findings", () => {
    // 1. Training reimbursement
    expect(DEMO_VERIFIED_LEGAL_SOURCES.training_reimbursement).toBeDefined();
    expect(DEMO_VERIFIED_LEGAL_SOURCES.training_reimbursement[0].citation).toContain("19 Del. C. § 1107");

    // 2. Broad IP assignment
    expect(DEMO_VERIFIED_LEGAL_SOURCES.ip_assignment).toBeDefined();
    expect(DEMO_VERIFIED_LEGAL_SOURCES.ip_assignment[0].jurisdiction).toBe("Delaware");

    // 3. 12-month nationwide non-compete
    expect(DEMO_VERIFIED_LEGAL_SOURCES.non_compete).toBeDefined();
    expect(DEMO_VERIFIED_LEGAL_SOURCES.non_compete[0].citation).toContain("Kodiak Bldg. Partners");

    // 4. Mandatory arbitration fee-shifting
    expect(DEMO_VERIFIED_LEGAL_SOURCES.arbitration).toBeDefined();
    expect(DEMO_VERIFIED_LEGAL_SOURCES.arbitration[0].citation).toContain("AAA");
  });

  // Test 14: Source metadata renders correctly and respects hierarchy
  it("14. renders complete source metadata and sorts by authority hierarchy", () => {
    const sources: LegalSource[] = [
      { ...validSource, id: "s-sec", sourceType: "secondary_source" },
      { ...validSource, id: "s-leg", sourceType: "official_legislation" },
      { ...validSource, id: "s-court", sourceType: "official_court" },
      { ...validSource, id: "s-agency", sourceType: "government_agency" },
    ];
    sources.sort(compareSourcePriority);
    expect(sources[0].sourceType).toBe("official_legislation");
    expect(sources[1].sourceType).toBe("official_court");
    expect(sources[2].sourceType).toBe("government_agency");
    expect(sources[3].sourceType).toBe("secondary_source");
  });

  // Test 15: Stale/old source is marked appropriately
  it("15. flags sources retrieved more than 2 years ago as temporally stale", () => {
    const staleSource: LegalSource = {
      ...validSource,
      retrievedAt: "2020-01-01T00:00:00Z",
    };
    const freshness = isSourceStale(staleSource);
    expect(freshness.isStale).toBe(true);
    expect(freshness.reason).toContain("more than 2 years ago");
  });

  // Test 16: "Hypothetical legal claim with confident wording but insufficient evidence"
  // Expected: claim downgraded or calibrated
  it("16. downgrades or calibrates hypothetical overconfident claim asserting illegality", () => {
    const overconfidentClaimText = "This clause is illegal and completely unlawful under state law.";
    const { calibrated, wasDowngraded } = calibrateLegalLanguage(overconfidentClaimText);
    expect(wasDowngraded).toBe(true);
    expect(calibrated).not.toContain("is illegal");
    expect(calibrated).toContain("may raise enforceability questions");

    // When processed through the hard verification gate
    const finding: Finding = SAMPLE_FINDINGS[0];
    const clause: Clause = SAMPLE_CLAUSES[5];
    const candidateClaim: LegalClaim = {
      id: "claim-overconfident",
      findingId: finding.id,
      claim: "This provision violates the law.",
      sourceIds: [validSource.id],
      supportLevel: "direct",
      explanation: "This clause is completely unlawful.",
      uncertainties: [],
      jurisdiction: "Delaware",
      verified: true,
    };

    const gateResult = runHardVerificationGate(
      finding,
      clause,
      [candidateClaim],
      [validSource],
      "Delaware"
    );

    expect(gateResult.calibratedClaims[0].claim).not.toContain("violates the law");
    expect(gateResult.calibratedClaims[0].explanation).not.toContain("completely unlawful");
    expect(gateResult.calibratedClaims[0].supportLevel).toBe("strong"); // downgraded from direct
  });

  // Test 17: User question flow 5-part answer
  it("17. answers user question with strict 5-part calibrated structure", async () => {
    const clause: Clause = {
      id: "clause-sec-6",
      section: "Section 6",
      title: "Training Fee Reimbursement",
      rawText:
        "If Employee resigns before completing twelve (12) full months of service, Employee shall repay the full sum of $18,500 as reimbursement for training expenses.",
      plainEnglish: "You repay $18,500 if you leave within 12 months.",
      category: "payment",
      pageNumber: 2,
      importance: "high_attention",
    };
    const result = await answerClauseQuestion(
      {
        documentId: "demo-doc",
        clauseId: "clause-sec-6",
        question: "Can my employer definitely charge me $18,500?",
        jurisdiction: "Delaware",
      },
      undefined,
      clause,
      DEMO_VERIFIED_LEGAL_SOURCES.training_reimbursement
    );

    expect(result.whatContractSays).toContain("$18,500");
    expect(result.legalContext).toContain("Delaware Wage Payment and Collection Act");
    expect(result.whatThisMeans).toBeDefined();
    expect(result.whatWeCannotDetermine).toContain("LawPilot cannot definitively determine");
    expect(result.nextStep).toContain("clarify");
    expect(result.confidence).toBe("moderate");
  });

  // Test 18: verifyAndAssembleEvidence orchestrates all chains
  it("18. verifyAndAssembleEvidence compiles full verification result for findings", async () => {
    const result = await verifyAndAssembleEvidence({
      findings: SAMPLE_FINDINGS,
      clauses: SAMPLE_CLAUSES,
      sources: [
        ...DEMO_VERIFIED_LEGAL_SOURCES.training_reimbursement,
        ...DEMO_VERIFIED_LEGAL_SOURCES.non_compete,
        ...DEMO_VERIFIED_LEGAL_SOURCES.ip_assignment,
        ...DEMO_VERIFIED_LEGAL_SOURCES.arbitration,
      ],
      jurisdiction: "Delaware",
    });

    expect(result.evidenceChains).toHaveLength(SAMPLE_FINDINGS.length);
    expect(result.verificationSummary).toContain("Assembled 5 verified evidence chains");
  });
});
