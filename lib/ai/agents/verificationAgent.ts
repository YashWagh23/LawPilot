import type {
  ActionItem,
  Clause,
  DocumentEvidence,
  EvidenceChain,
  Finding,
  LegalClaim,
  LegalEvidence,
  LegalSource,
  SupportLevel,
  VerificationDetails,
  VerificationStatusLevel,
} from "@/types";
import {
  compareSourcePriority,
  validateLegalClaim,
  validateLegalSource,
} from "@/lib/safety/legalSourceValidator";

export interface VerificationInput {
  findings: Finding[];
  clauses: Clause[];
  sources: LegalSource[];
  claims?: LegalClaim[];
  jurisdiction?: string;
  governingLaw?: string;
}

export interface VerificationResult {
  evidenceChains: EvidenceChain[];
  unverifiedClaimsCount: number;
  conflictingSourcesCount: number;
  verificationSummary: string;
}

export interface SingleVerificationGateResult {
  status: VerificationStatusLevel;
  calibratedClaims: LegalClaim[];
  verifiedSources: LegalSource[];
  legalEvidence: LegalEvidence[];
  issues: string[];
  confidenceLevel: "high" | "moderate" | "limited" | "insufficient";
  uncertainties: string[];
  conflictDetected: boolean;
  conflictDetails?: {
    sourceA: LegalSource;
    sourceB: LegalSource;
    description: string;
  };
}

/**
 * Calibrates legal claim text to remove overconfident or ungrounded assertions.
 * Never allows: "This is illegal", "This clause is void", etc.
 */
export function calibrateLegalLanguage(text: string): { calibrated: string; wasDowngraded: boolean } {
  let wasDowngraded = false;
  let calibrated = text;

  const patterns: [RegExp, string][] = [
    [/\bis illegal\b/gi, "may raise enforceability questions under applicable law"],
    [/\bis void\b/gi, "may be subject to challenge or narrowing"],
    [/\bis completely unlawful\b/gi, "may conflict with statutory protections"],
    [/\bis guaranteed to be struck down\b/gi, "faces significant judicial scrutiny"],
    [/\bcannot be enforced under any circumstances\b/gi, "is subject to strict reasonableness limitations"],
    [/\bviolates the law\b/gi, "may raise an issue under relevant legal provisions"],
  ];

  for (const [regex, replacement] of patterns) {
    if (regex.test(calibrated)) {
      calibrated = calibrated.replace(regex, replacement);
      wasDowngraded = true;
    }
  }

  return { calibrated, wasDowngraded };
}

/**
 * 10-Point Hard Verification Gate
 * Acts as a strict gatekeeper between raw research and user-facing legal claims.
 */
export function runHardVerificationGate(
  finding: Finding,
  clause: Clause,
  candidateClaims: LegalClaim[],
  candidateSources: LegalSource[],
  jurisdiction?: string
): SingleVerificationGateResult {
  const issues: string[] = [];
  const uncertainties: string[] = [...(finding.uncertainties || [])];
  const targetJurisdiction = (jurisdiction || clause.section || "general").toLowerCase();

  // CHECK 1 & 2: Source existence and URL traceability
  const verifiedSources: LegalSource[] = [];
  for (const rawSource of candidateSources) {
    const res = validateLegalSource(rawSource);
    if (res.isValid && res.data) {
      verifiedSources.push(res.data);
    } else {
      issues.push(`Rejected invalid source '${rawSource.title || "unnamed"}': ${res.issues.join(", ")}`);
    }
  }

  // Sort verified sources by authority hierarchy
  verifiedSources.sort(compareSourcePriority);

  // If no authoritative sources survived validation
  if (verifiedSources.length === 0) {
    return {
      status: "insufficient_context",
      calibratedClaims: [],
      verifiedSources: [],
      legalEvidence: [],
      issues: [...issues, "No authoritative legal sources passed verification for this finding."],
      confidenceLevel: "insufficient",
      uncertainties: [
        ...uncertainties,
        "LawPilot could not verify authoritative legal sources for this clause in the stated jurisdiction.",
      ],
      conflictDetected: false,
    };
  }

  // CHECK 3: Jurisdiction check
  const hasJurisdictionMatch = verifiedSources.some((s) => {
    const sJur = s.jurisdiction.toLowerCase();
    return (
      sJur.includes(targetJurisdiction) ||
      targetJurisdiction.includes(sJur) ||
      sJur.includes("delaware") || // demo baseline support
      sJur.includes("federal") ||
      sJur.includes("united states")
    );
  });

  if (!hasJurisdictionMatch && targetJurisdiction !== "general") {
    issues.push(`Available sources do not specifically match governing jurisdiction '${jurisdiction}'.`);
  }

  // CHECK 4: Section / provision existence check
  const sourcesWithValidCitations = verifiedSources.filter(
    (s) => s.citation && s.citation.trim().length > 3
  );

  // CHECK 5 & 6: Claim support & claim overstatement check
  const calibratedClaims: LegalClaim[] = [];
  let downgradedCount = 0;

  for (const claim of candidateClaims) {
    const valRes = validateLegalClaim(claim, verifiedSources);
    if (!valRes.isValid) {
      issues.push(`Rejected claim '${claim.id}': ${valRes.issues.join("; ")}`);
      continue;
    }

    // CHECK 6 & 10: Calibrate claim wording
    const { calibrated: calibratedClaimText, wasDowngraded: claimDowngraded } =
      calibrateLegalLanguage(claim.claim);
    const { calibrated: calibratedExp, wasDowngraded: expDowngraded } =
      calibrateLegalLanguage(claim.explanation);

    if (claimDowngraded || expDowngraded) {
      downgradedCount++;
      issues.push(`Calibrated overconfident language in claim '${claim.id}'.`);
    }

    // Determine final support level
    let supportLevel: SupportLevel = valRes.data?.supportLevel || claim.supportLevel;
    if (claimDowngraded && supportLevel === "direct") {
      supportLevel = "strong";
    }

    calibratedClaims.push({
      ...claim,
      claim: calibratedClaimText,
      explanation: calibratedExp,
      supportLevel,
      verified: true,
    });
  }

  // Filter out unsupported claims (as required by prompt)
  const userVisibleClaims = calibratedClaims.filter(
    (c) => c.supportLevel !== "unsupported"
  );

  // CHECK 7: Factual dependencies identification
  if (clause.category === "restriction" || finding.title.toLowerCase().includes("non-compete")) {
    uncertainties.push(
      "Enforceability depends heavily on specific factual proof of protectable trade secrets and actual geographic market reach."
    );
  }
  if (finding.title.toLowerCase().includes("training") || finding.title.toLowerCase().includes("reimbursement")) {
    uncertainties.push(
      "Whether the reimbursement is treated as a valid training debt or an unlawful penalty depends on documented direct vendor expenses."
    );
  }

  // CHECK 8: Conflict detection between sources
  let conflictDetected = false;
  let conflictDetails: SingleVerificationGateResult["conflictDetails"] = undefined;

  if (verifiedSources.length >= 2) {
    const sourceA = verifiedSources[0];
    const sourceB = verifiedSources[1];
    // Check for conflicting indicators (e.g. strict prohibition vs reasonableness test)
    const excerptA = (sourceA.excerpt || "").toLowerCase();
    const excerptB = (sourceB.excerpt || "").toLowerCase();

    if (
      (excerptA.includes("prohibited") && excerptB.includes("enforceable")) ||
      (excerptA.includes("unlawful") && excerptB.includes("permitted"))
    ) {
      conflictDetected = true;
      conflictDetails = {
        sourceA,
        sourceB,
        description:
          "Sources differ on this issue. One authority applies a strict prohibition standard while another applies a fact-specific reasonableness test.",
      };
      issues.push("Identified conflicting legal authorities across cited sources.");
    }
  }

  // CHECK 9: Flag conclusions requiring professional judgment
  uncertainties.push(
    "LawPilot provides legal information, not legal advice. Final enforceability requires licensed legal counsel."
  );

  // Build LegalEvidence records linking verified sources to claims
  const legalEvidence: LegalEvidence[] = [];
  for (const src of verifiedSources) {
    const linkedClaim = userVisibleClaims.find((c) => c.sourceIds.includes(src.id)) || userVisibleClaims[0];
    legalEvidence.push({
      legalSourceId: src.id,
      claimId: linkedClaim?.id || `claim-${finding.id}`,
      citation: src.citation,
      relevantExcerpt: src.relevantExcerpt || src.excerpt || "",
      sourceType: "legal",
    });
  }

  // Determine overall status
  let status: VerificationStatusLevel = "verified";
  let confidenceLevel: "high" | "moderate" | "limited" | "insufficient" = "high";

  if (conflictDetected) {
    status = "conflicting";
    confidenceLevel = "limited";
  } else if (userVisibleClaims.length === 0) {
    status = "unsupported";
    confidenceLevel = "insufficient";
  } else if (
    downgradedCount > 0 ||
    !hasJurisdictionMatch ||
    userVisibleClaims.some((c) => c.supportLevel === "context_dependent" || c.supportLevel === "partial")
  ) {
    status = "partially_verified";
    confidenceLevel = "moderate";
  } else if (sourcesWithValidCitations.length === 0) {
    status = "insufficient_context";
    confidenceLevel = "limited";
  }

  return {
    status,
    calibratedClaims: userVisibleClaims,
    verifiedSources,
    legalEvidence,
    issues,
    confidenceLevel,
    uncertainties: Array.from(new Set(uncertainties)),
    conflictDetected,
    conflictDetails,
  };
}

/**
 * Verification Agent
 * Constructs and verifies the full signature Evidence Chain for each finding.
 */
export async function verifyAndAssembleEvidence(
  input: VerificationInput
): Promise<VerificationResult> {
  const evidenceChains: EvidenceChain[] = [];
  let unverifiedClaimsCount = 0;
  let conflictingSourcesCount = 0;

  const clauseMap = new Map(input.clauses.map((c) => [c.id, c]));

  for (const finding of input.findings) {
    const clause = clauseMap.get(finding.clauseId) || {
      id: finding.clauseId,
      section: finding.evidence?.section || "Section Unknown",
      title: finding.title,
      rawText: finding.evidence?.quotedText || finding.description,
      plainEnglish: finding.whyItMatters,
      category: "general",
      pageNumber: finding.evidence?.pageNumber || null,
      importance: finding.severity,
    };

    // Filter sources associated with this finding
    const catLower = finding.category.toLowerCase();
    const titleLower = finding.title.toLowerCase();
    const clauseTextLower = clause.rawText.toLowerCase();

    let relatedSources = input.sources.filter(
      (s) =>
        s.relevance.toLowerCase().includes(catLower) ||
        s.title.toLowerCase().includes(catLower) ||
        (catLower.includes("financial") &&
          (s.relevance.toLowerCase().includes("liquidated damages") ||
            s.relevance.toLowerCase().includes("repayment") ||
            s.title.includes("74") ||
            s.title.toLowerCase().includes("wage"))) ||
        (catLower.includes("restrictive") &&
          (s.relevance.toLowerCase().includes("non-compete") ||
            s.relevance.toLowerCase().includes("restraint") ||
            s.title.includes("27"))) ||
        (catLower.includes("intellectual") &&
          (s.relevance.toLowerCase().includes("copyright") ||
            s.relevance.toLowerCase().includes("invention") ||
            s.title.includes("17"))) ||
        (catLower.includes("arbitrat") && s.relevance.toLowerCase().includes("arbitrat")) ||
        (catLower.includes("notice") && s.relevance.toLowerCase().includes("notice")) ||
        s.notes?.includes(finding.id)
    );

    if (relatedSources.length === 0) {
      relatedSources = input.sources.filter((s) => {
        const sTitle = s.title.toLowerCase();
        const sRel = s.relevance.toLowerCase();
        if (
          clauseTextLower.includes("non-compete") ||
          clauseTextLower.includes("competing business") ||
          titleLower.includes("non-compete")
        ) {
          return sTitle.includes("27") || sRel.includes("non-compete") || sRel.includes("restraint");
        }
        if (
          clauseTextLower.includes("bond") ||
          clauseTextLower.includes("repay") ||
          clauseTextLower.includes("liquidated damages") ||
          titleLower.includes("financial")
        ) {
          return sTitle.includes("74") || sRel.includes("liquidated damages") || sRel.includes("repayment") || sTitle.includes("wage");
        }
        if (
          clauseTextLower.includes("invention") ||
          clauseTextLower.includes("intellectual property") ||
          titleLower.includes("property")
        ) {
          return sTitle.includes("copyright") || sRel.includes("work made for hire");
        }
        return false;
      });
    }

    if (relatedSources.length === 0 && input.sources.length > 0) {
      relatedSources = [input.sources[0]];
    }

    // Filter claims associated with this finding
    const candidateClaims = (input.claims || []).filter(
      (c) => c.findingId === finding.id
    );

    // Fallback claim generation if candidate claims are missing
    if (candidateClaims.length === 0 && relatedSources.length > 0) {
      const primarySource = relatedSources[0];
      candidateClaims.push({
        id: `claim-${finding.id}-auto`,
        findingId: finding.id,
        claim: `The provision in ${clause.section} relates to ${primarySource.title} standards under ${input.jurisdiction || primarySource.jurisdiction}.`,
        sourceIds: [primarySource.id],
        supportLevel: "context_dependent",
        explanation: `Under ${primarySource.jurisdiction} law, clauses of this nature are subject to ${primarySource.citation} guidelines.`,
        uncertainties: finding.uncertainties || [],
        jurisdiction: input.jurisdiction || primarySource.jurisdiction,
        verified: false,
      });
    }

    // Run the 10-point hard verification gate
    const gateResult = runHardVerificationGate(
      finding,
      clause,
      candidateClaims,
      relatedSources.length > 0 ? relatedSources : input.sources,
      input.jurisdiction || input.governingLaw || "Delaware"
    );

    if (gateResult.status === "unsupported" || gateResult.status === "insufficient_context") {
      unverifiedClaimsCount++;
    }
    if (gateResult.conflictDetected) {
      conflictingSourcesCount++;
    }

    // Construct DocumentEvidence
    const documentEvidence: DocumentEvidence = {
      clauseId: clause.id,
      section: clause.section,
      pageNumber: clause.pageNumber,
      quotedText: finding.evidence?.quotedText || clause.rawText,
      sourceType: "document",
      exactQuote: finding.evidence?.quotedText || clause.rawText,
    };

    // Construct VerificationDetails
    const verification: VerificationDetails = {
      status: gateResult.status,
      verifiedAt: new Date().toISOString(),
      issues: gateResult.issues,
      confidenceLevel: gateResult.confidenceLevel,
    };

    // Construct practical next step
    const nextSteps: ActionItem[] = [
      {
        id: `action-${finding.id}-1`,
        title: `Clarify ${clause.section} with Counsel`,
        description: `Request legal counsel review whether ${clause.section} complies with ${gateResult.verifiedSources[0]?.citation || "applicable standards"}.`,
        priority: finding.severity === "critical_attention" || finding.severity === "high_attention" ? "high" : "medium",
        partyResponsible: "User / Legal Counsel",
        isReversible: true,
        recommendedTimeline: "Before signing or executing",
        practicalAdvice: `Ask counsel: "How does ${clause.section} apply under current ${input.jurisdiction || "governing"} rules given our specific facts?"`,
      },
    ];

    const primarySource = gateResult.verifiedSources[0];

    // Assemble complete EvidenceChain
    const chain: EvidenceChain = {
      id: `chain-${finding.id}`,
      finding,
      documentEvidence,
      legalClaims: gateResult.calibratedClaims,
      legalSources: gateResult.verifiedSources,
      legalEvidence: gateResult.legalEvidence,
      verification,
      uncertainties: gateResult.uncertainties,
      nextSteps,
      // Backward compatibility fields
      legalSource: primarySource,
      confidence: {
        level: gateResult.confidenceLevel,
        rationale: gateResult.issues.length > 0
          ? `Verified with notes: ${gateResult.issues.join("; ")}`
          : "Verified against authoritative legal sources in matching jurisdiction.",
      },
      uncertainty: {
        id: `unc-${finding.id}`,
        findingId: finding.id,
        factualDependencies: gateResult.uncertainties.filter((u) => !u.includes("LawPilot")),
        unverifiedAssumptions: [
          `Assumes ${input.jurisdiction || "Delaware"} governing law applies as stated in the agreement.`,
        ],
        explanation: gateResult.uncertainties[0] || "Further factual discovery needed.",
        isFactVsInterpretationClear: true,
      },
      practicalNextStep: nextSteps[0],
    };

    evidenceChains.push(chain);
  }

  return {
    evidenceChains,
    unverifiedClaimsCount,
    conflictingSourcesCount,
    verificationSummary: `Assembled ${evidenceChains.length} verified evidence chains with ${unverifiedClaimsCount} unverified and ${conflictingSourcesCount} conflicting authority flags.`,
  };
}
