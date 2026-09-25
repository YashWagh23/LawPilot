import type {
  ClauseComparisonItem,
  EvidenceChain,
  JurisdictionComparison,
  JurisdictionContext,
  LegalClaim,
  LegalSource,
} from "@/types";
import { DEMO_VERIFIED_INDIAN_LEGAL_SOURCES, selectCuratedLegalSources } from "@/lib/ai/agents/legalResearchAgent";
import type { DocumentType } from "@/types";

/**
 * Compares jurisdiction metadata between previous and current documents
 */
export function compareJurisdictions(
  prevJurisdiction?: JurisdictionContext,
  currJurisdiction?: JurisdictionContext
): JurisdictionComparison {
  const unknown: JurisdictionContext = {
    country: "Unknown",
    confidence: "unknown",
    source: "inferred",
    evidence: ["No jurisdiction signals found in document text."],
  };

  const prev = prevJurisdiction || unknown;
  const curr = currJurisdiction || unknown;

  const prevCountry = (prev.country || "Unknown").trim().toLowerCase();
  const currCountry = (curr.country || "Unknown").trim().toLowerCase();
  const prevUnknown = prevCountry === "unknown";
  const currUnknown = currCountry === "unknown";

  const prevState = (prev.stateOrUT || "").trim().toLowerCase();
  const currState = (curr.stateOrUT || "").trim().toLowerCase();

  const isCountryAligned = prevCountry === currCountry;
  const isStateAligned = prevState === "" || currState === "" || prevState === currState;
  const isAligned = isCountryAligned && isStateAligned;

  let statusLabel = "";
  let warning: string | undefined = undefined;

  if (prevUnknown && currUnknown) {
    statusLabel = "Jurisdiction not established in either document";
  } else if (prevUnknown !== currUnknown) {
    statusLabel = "JURISDICTION CHANGED";
    warning = `${prevUnknown ? "The previous document does not establish a governing jurisdiction" : `Previous document was governed by ${prev.country}${prev.stateOrUT ? ` (${prev.stateOrUT})` : ""}`}, while ${
      currUnknown ? "the revised document does not establish one" : `the revised document specifies ${curr.country}${curr.stateOrUT ? ` (${curr.stateOrUT})` : ""}`
    }. Confirm which law governs before relying on either draft.`;
  } else if (isAligned) {
    const displayState = prev.stateOrUT ? ` · ${prev.stateOrUT}` : curr.stateOrUT ? ` · ${curr.stateOrUT}` : "";
    statusLabel = `${prev.country}${displayState} · Jurisdiction Aligned`;
  } else {
    statusLabel = "JURISDICTION CHANGED";
    warning = `Previous document was governed by ${prev.country}${
      prev.stateOrUT ? ` (${prev.stateOrUT})` : ""
    }, while the revised document specifies ${curr.country}${
      curr.stateOrUT ? ` (${curr.stateOrUT})` : ""
    }. This may materially alter statutory protections and standard contract interpretation. Do not silently assume the newer document controls.`;
  }

  return {
    previousJurisdiction: prev,
    currentJurisdiction: curr,
    isAligned: prevUnknown !== currUnknown ? false : isAligned,
    statusLabel,
    warning,
  };
}

/**
 * Maps high/medium significance changes to verified legal context and Evidence Chains
 */
export function integrateLegalContext(
  changes: ClauseComparisonItem[],
  jurisdictionComp: JurisdictionComparison,
  documentType: DocumentType = "employment_agreement"
): ClauseComparisonItem[] {
  const isIndian = jurisdictionComp.currentJurisdiction.country.toLowerCase() === "india";
  const isEmployment = documentType === "employment_agreement";
  // Curated authority that legitimately applies to this document type in this jurisdiction.
  const allowedIds = new Set(selectCuratedLegalSources(jurisdictionComp.currentJurisdiction, documentType).map((s) => s.id));
  const onlyAllowed = (list: LegalSource[] | undefined): LegalSource[] => (list || []).filter((s) => allowedIds.has(s.id));

  return changes.map((change) => {
    // Only link legal authorities to material changes (HIGH / MEDIUM)
    if (change.significance !== "HIGH" && change.significance !== "MEDIUM") {
      return change;
    }

    const titleLower = change.clauseTitle.toLowerCase();
    let sources: LegalSource[] = [];
    let legalClaimText = "";
    let questionText = "";
    let uncertaintyText = "";
    let nextStepText = "";

    if (isIndian) {
      const changeText = `${change.whatChanged.original} ${change.whatChanged.revised}`.toLowerCase();
      const isTrainingTopic =
        isEmployment && (/training|bond|clawback|reimburs/.test(titleLower) || /training|clawback/.test(changeText));
      if (isTrainingTopic) {
        sources = onlyAllowed(DEMO_VERIFIED_INDIAN_LEGAL_SOURCES.training_reimbursement);
        questionText = "Are liquidated damages / training bond clawback stipulations enforceable under Indian law?";
        legalClaimText =
          "Under Section 74 of the Indian Contract Act, 1872 and Supreme Court precedent (Kailash Nath Associates), stipulated amounts in employment bonds are treated as upper limits rather than automatic penalties; employers must prove actual loss and cannot enforce arbitrary penalties.";
        uncertaintyText =
          "Whether the employer has kept itemized receipts or documented actual expenditure incurred on specialized external training.";
        nextStepText =
          "Request itemized documentation of training expenses and propose a proportional monthly amortization schedule.";
      } else if (isEmployment && (titleLower.includes("non-compete") || change.category === "restriction")) {
        sources = onlyAllowed(DEMO_VERIFIED_INDIAN_LEGAL_SOURCES.non_compete);
        questionText = "Is a post-employment non-compete covenant valid and enforceable in India?";
        legalClaimText =
          "Under Section 27 of the Indian Contract Act, 1872 and Supreme Court precedent (Percept D'Mark v. Zaheer Khan), restrictive covenants that extend beyond the term of employment are void ab initio as restraints of trade.";
        uncertaintyText =
          "Whether the provision could still be used to withhold experience letters or initiate non-solicitation disputes regarding specific company clients.";
        nextStepText =
          "Clarify that the restriction is limited to non-solicitation of active clients and remove general industry employment bans.";
      } else if (isEmployment && (titleLower.includes("intellectual") || titleLower.includes("inventions") || change.category === "intellectual_property")) {
        sources = onlyAllowed(DEMO_VERIFIED_INDIAN_LEGAL_SOURCES.ip_assignment);
        questionText = "Does statutory employer copyright extend to works created outside work hours on personal hardware?";
        legalClaimText =
          "Section 17(c) of the Copyright Act, 1957 vests copyright in the employer only for works made 'in the course of employment under a contract of service'; broader assignment of off-hours personal software requires explicit bilateral consideration and documentation.";
        uncertaintyText =
          "Whether personal side projects developed during off-hours utilize any company libraries, domain know-how, or proprietary architectures.";
        nextStepText =
          "Attach an Exhibit listing pre-existing personal intellectual property and open-source contributions to carve them out from assignment.";
      } else if (titleLower.includes("arbitrat") || titleLower.includes("dispute") || change.category === "dispute_resolution") {
        sources = onlyAllowed(DEMO_VERIFIED_INDIAN_LEGAL_SOURCES.arbitration);
        questionText = "Can one party unilaterally designate or appoint a sole arbitrator in India?";
        legalClaimText =
          "Under Section 12(5) of the Arbitration and Conciliation Act, 1996 and Supreme Court precedent (Perkins Eastman Architects DPC v. HSCC), an interested party who has an interest in the outcome of the dispute is legally ineligible to unilaterally appoint a sole arbitrator.";
        uncertaintyText =
          "Whether the arbitration clause contains a fallback to institutional arbitration (e.g. MCIA) or mutual consensus if the unilateral appointment is contested.";
        nextStepText =
          "Propose mutual consensus appointment or institutional appointment under the Mumbai Centre for International Arbitration (MCIA) rules.";
      }
    }

    if (sources.length === 0) {
      return change;
    }

    const primarySource = sources[0];

    const legalClaim: LegalClaim = {
      id: `claim-compare-${change.id}`,
      findingId: `finding-compare-${change.id}`,
      claim: legalClaimText,
      sourceIds: sources.map((s) => s.id),
      supportLevel: "direct",
      explanation: legalClaimText,
      uncertainties: [uncertaintyText],
      jurisdiction: primarySource.jurisdiction,
      verified: true,
    };

    const evidenceChain: EvidenceChain = {
      id: `chain-compare-${change.id}`,
      jurisdictionContext: jurisdictionComp.currentJurisdiction,
      finding: {
        id: `finding-compare-${change.id}`,
        title: `Material Revision: ${change.clauseTitle}`,
        category: change.category,
        severity: change.significance === "HIGH" ? "critical_attention" : "high_attention",
        description: change.whyItMatters,
        whyItMatters: change.whyItMatters,
        clauseId: change.currentClause?.id || change.previousClause?.id || change.id,
        evidence: {
          findingId: `finding-compare-${change.id}`,
          documentId: "current-version",
          clauseId: change.currentClause?.id || change.id,
          pageNumber: change.currentClause?.pageNumber || null,
          section: change.currentSection || change.previousSection || "Section",
          quotedText: change.whatChanged.revised,
        },
        uncertainties: [uncertaintyText],
      },
      documentEvidence: {
        clauseId: change.currentClause?.id || change.id,
        quotedText: change.whatChanged.revised,
        pageNumber: change.currentClause?.pageNumber || null,
        section: change.currentSection || change.previousSection || "Section",
        sourceType: "document",
      },
      legalClaims: [legalClaim],
      legalSources: sources,
      // Status is "partially_verified" (not "verified") because this pairing is a heuristic,
      // clause-title keyword match to a curated authority rather than a clause-by-clause
      // verification pass — the citations themselves are real, but their applicability to this
      // specific revision has not been individually confirmed.
      verification: {
        status: "partially_verified",
        verifiedAt: new Date().toISOString(),
        issues: [
          "Legal context matched by clause-title keyword heuristic, not a full per-clause verification pass.",
        ],
        confidenceLevel: "moderate",
      },
      uncertainties: [uncertaintyText],
      nextSteps: [
        {
          id: `step-compare-${change.id}`,
          title: change.suggestedActionItem.title,
          description: change.suggestedActionItem.explanation,
          priority: change.significance === "HIGH" ? "high" : "medium",
          partyResponsible: "User",
          isReversible: true,
          recommendedTimeline: "Before execution",
          practicalAdvice: nextStepText,
        },
      ],
    };

    const legalContextSnippet = {
      findingId: `finding-compare-${change.id}`,
      legalQuestion: questionText,
      legalClaim: legalClaimText,
      citation: primarySource.citation,
      sourceTitle: primarySource.title,
      jurisdiction: primarySource.jurisdiction,
      uncertainty: uncertaintyText,
      practicalNextStep: nextStepText,
    };

    return {
      ...change,
      evidenceChain,
      legalContextSnippet,
    };
  });
}
