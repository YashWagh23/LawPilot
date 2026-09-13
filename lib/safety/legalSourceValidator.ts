import type {
  LegalClaim,
  LegalSource,
  SourceType,
  SupportLevel,
} from "@/types";

/**
 * Numeric priority ranking for sources.
 * Lower number = higher authority.
 */
export const SOURCE_TYPE_PRIORITY: Record<SourceType, number> = {
  official_legislation: 1,
  official_court: 2,
  government_agency: 3,
  regulator: 4,
  recognized_legal_source: 5,
  secondary_source: 6,
  general_web: 7,
  unverified: 8,
};

export interface ValidationResult<T> {
  isValid: boolean;
  issues: string[];
  data?: T;
}

/**
 * Validates a legal source record against strict reliability and authenticity rules.
 * Enforces LawPilot Rule 2: Zero source fabrication.
 */
export function validateLegalSource(
  source: Partial<LegalSource>
): ValidationResult<LegalSource> {
  const issues: string[] = [];

  // 1. Title validation
  if (!source.title || source.title.trim().length === 0) {
    issues.push("Legal source title is missing or empty.");
  }

  // 2. SourceType validation
  if (!source.sourceType || !(source.sourceType in SOURCE_TYPE_PRIORITY)) {
    issues.push(`Invalid source type: '${source.sourceType}'.`);
  } else if (source.sourceType === "unverified") {
    issues.push("Model internal knowledge alone cannot be treated as a verified legal authority.");
  }

  // 3. Jurisdiction validation
  if (!source.jurisdiction || source.jurisdiction.trim().length === 0) {
    issues.push("Legal source jurisdiction must be specified.");
  }

  // 4. Citation validation
  if (!source.citation || source.citation.trim().length === 0) {
    issues.push("Citation is required for authoritative legal sources.");
  } else if (
    /^(n\/a|none|pending|tbd|citation needed|unknown)$/i.test(
      source.citation.trim()
    )
  ) {
    issues.push("Placeholder or evasive citation detected.");
  }

  // 5. URL validation (if provided)
  const sourceUrl = source.url || source.sourceUrl;
  if (sourceUrl) {
    try {
      const parsed = new URL(sourceUrl);
      if (!["http:", "https:"].includes(parsed.protocol)) {
        issues.push("Source URL must use http or https protocol.");
      }
      if (
        parsed.hostname === "localhost" ||
        parsed.hostname === "127.0.0.1" ||
        parsed.hostname.endsWith(".example.com")
      ) {
        issues.push("Source URL cannot reference private, local, or example domains.");
      }
    } catch {
      issues.push(`Malformed source URL: '${sourceUrl}'.`);
    }
  }

  // 6. Excerpt / text grounding validation
  const excerpt = source.relevantExcerpt || source.excerpt || "";
  if (!excerpt || excerpt.trim().length === 0) {
    issues.push("Legal source must include a relevant statutory or case excerpt.");
  }

  // 7. Retrieval timestamp
  if (!source.retrievedAt) {
    issues.push("Missing 'retrievedAt' timestamp for source temporal grounding.");
  }

  if (issues.length > 0) {
    return { isValid: false, issues };
  }

  const sanitized: LegalSource = {
    id: source.id || `source-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    title: source.title!.trim(),
    publisher: source.publisher?.trim() || "Official Legal Authority",
    sourceType: source.sourceType!,
    jurisdiction: source.jurisdiction!.trim(),
    citation: source.citation!.trim(),
    url: sourceUrl,
    sourceUrl: sourceUrl,
    relevance: source.relevance?.trim() || "Relevant to identified clause",
    retrievedAt: source.retrievedAt!,
    publicationDate: source.publicationDate,
    verificationStatus: source.verificationStatus || "verified",
    excerpt: excerpt.trim(),
    relevantExcerpt: excerpt.trim(),
    notes: source.notes?.trim() || "",
  };

  return { isValid: true, issues: [], data: sanitized };
}

/**
 * Checks whether a legal source might be stale.
 * Law changes over time; material retrieved over 730 days (2 years) ago is flagged.
 */
export function isSourceStale(source: LegalSource): { isStale: boolean; reason?: string } {
  const retrievedTime = new Date(source.retrievedAt).getTime();
  if (isNaN(retrievedTime)) {
    return { isStale: true, reason: "Unable to parse retrievedAt date." };
  }

  const now = Date.now();
  const twoYearsMs = 2 * 365 * 24 * 60 * 60 * 1000;
  if (now - retrievedTime > twoYearsMs) {
    return {
      isStale: true,
      reason: "Source was retrieved more than 2 years ago. Legal rules may have changed.",
    };
  }

  return { isStale: false };
}

/**
 * Validates a proposed LegalClaim against its associated sources and jurisdiction.
 * Rejects claims with no valid sources, model-only sources, or jurisdiction mismatches.
 */
export function validateLegalClaim(
  claim: LegalClaim,
  availableSources: LegalSource[]
): ValidationResult<LegalClaim> {
  const issues: string[] = [];

  // Check 1: Claim statement
  if (!claim.claim || claim.claim.trim().length === 0) {
    issues.push("Legal claim statement is empty.");
  }

  // Check 2: Linked sources
  if (!claim.sourceIds || claim.sourceIds.length === 0) {
    issues.push("Legal claim has no linked authoritative sources.");
  }

  // Check 3: Sources exist in available set
  const sourceMap = new Map(availableSources.map((s) => [s.id, s]));
  const resolvedSources = claim.sourceIds
    .map((id) => sourceMap.get(id))
    .filter((s): s is LegalSource => !!s);

  if (resolvedSources.length === 0) {
    issues.push("None of the claimed source IDs correspond to verified sources in context.");
  }

  // Check 4: No model-only / unverified sources
  const validAuthoritativeSources = resolvedSources.filter(
    (s) => s.sourceType !== "unverified"
  );
  if (validAuthoritativeSources.length === 0) {
    issues.push("Claim relies solely on unverified or model-internal sources.");
  }

  // Check 5: Jurisdiction compatibility
  const claimJur = claim.jurisdiction.toLowerCase().trim();
  const hasMatchingJurisdiction = resolvedSources.some((s) => {
    const sJur = s.jurisdiction.toLowerCase().trim();
    return (
      sJur.includes(claimJur) ||
      claimJur.includes(sJur) ||
      sJur === "federal" ||
      sJur.includes("united states") ||
      claimJur.includes("federal")
    );
  });

  if (!hasMatchingJurisdiction && claimJur !== "general") {
    issues.push(
      `Claim jurisdiction '${claim.jurisdiction}' does not match jurisdiction of cited sources.`
    );
  }

  // Calibrate support level
  let calibratedSupportLevel: SupportLevel = claim.supportLevel;
  if (issues.length > 0) {
    calibratedSupportLevel = "unsupported";
  } else if (resolvedSources.some((s) => s.sourceType === "secondary_source")) {
    // Secondary source alone cannot provide "direct" support
    if (claim.supportLevel === "direct") {
      calibratedSupportLevel = "strong";
    }
  }

  if (issues.length > 0) {
    return {
      isValid: false,
      issues,
      data: { ...claim, supportLevel: "unsupported", verified: false },
    };
  }

  return {
    isValid: true,
    issues: [],
    data: {
      ...claim,
      supportLevel: calibratedSupportLevel,
      verified: true,
    },
  };
}

/**
 * Sorts sources by authoritative hierarchy (lower rank number first).
 */
export function compareSourcePriority(a: LegalSource, b: LegalSource): number {
  const priorityA = SOURCE_TYPE_PRIORITY[a.sourceType] ?? 99;
  const priorityB = SOURCE_TYPE_PRIORITY[b.sourceType] ?? 99;
  return priorityA - priorityB;
}
