/**
 * LawPilot Jurisdiction Detection Engine
 * "Understand. Verify. Act."
 *
 * Identifies jurisdiction signals from legal documents:
 * - Governing law clauses
 * - Jurisdiction / venue clauses
 * - Statutory & regulatory references
 * - Court references
 * - Addresses, PIN codes & corporate entity suffixes
 * - Currency tokens
 *
 * Rules:
 * - Never silently assume jurisdiction when the document does not establish it.
 * - If jurisdiction is uncertain, surface ambiguity warnings.
 * - User-provided jurisdiction overrides inference.
 * - Document-stated governing law is extracted as verified evidence.
 * - Inference must never be presented as confirmed fact.
 * - An explicit governing-law clause always outranks venue, statute, address and currency hints.
 */

import { Clause, DocumentMetadata, JurisdictionConfidence, JurisdictionContext, JurisdictionSource } from "@/types";

export interface JurisdictionDetectionInput {
  text: string;
  clauses?: Clause[];
  metadata?: Partial<DocumentMetadata>;
}

/**
 * Common Indian States and Union Territories with known commercial hubs.
 * Matched on word boundaries (so "ncr" does not match "concrete").
 */
const INDIAN_STATE_CITY_MAP: Record<string, string[]> = {
  Maharashtra: ["mumbai", "pune", "nagpur", "thane", "navi mumbai", "bkc", "bandra", "nashik", "aurangabad", "bombay"],
  Karnataka: ["bengaluru", "bangalore", "mysuru", "mysore", "hubli"],
  Delhi: ["new delhi", "delhi", "ncr"],
  Haryana: ["gurugram", "gurgaon", "faridabad"],
  "Uttar Pradesh": ["noida", "greater noida", "lucknow", "kanpur", "ghaziabad", "agra"],
  Telangana: ["hyderabad", "secunderabad", "cyberabad"],
  "Tamil Nadu": ["chennai", "madras", "coimbatore"],
  "West Bengal": ["kolkata", "calcutta"],
  Gujarat: ["ahmedabad", "gandhinagar", "vadodara", "surat"],
  Rajasthan: ["jaipur", "jodhpur", "udaipur"],
  Kerala: ["kochi", "cochin", "thiruvananthapuram", "trivandrum"],
  Punjab: ["chandigarh", "ludhiana", "amritsar"],
  "Madhya Pradesh": ["bhopal", "indore"],
  Goa: ["panaji", "margao"],
};

const INDIAN_STATES_AND_UTS = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", "Haryana",
  "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur",
  "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana",
  "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal", "Delhi", "Chandigarh", "Puducherry",
  "Jammu and Kashmir", "Ladakh",
];

const US_STATES = [
  "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut", "Delaware", "Florida",
  "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa", "Kansas", "Kentucky", "Louisiana", "Maine", "Maryland",
  "Massachusetts", "Michigan", "Minnesota", "Mississippi", "Missouri", "Montana", "Nebraska", "Nevada",
  "New Hampshire", "New Jersey", "New Mexico", "New York", "North Carolina", "North Dakota", "Ohio", "Oklahoma",
  "Oregon", "Pennsylvania", "Rhode Island", "South Carolina", "South Dakota", "Tennessee", "Texas", "Utah",
  "Vermont", "Virginia", "West Virginia", "Wisconsin", "Wyoming",
];

/** Names that are also countries/cities; only counted as US states when written "State of X". */
const AMBIGUOUS_US_STATE_NAMES = new Set(["Georgia", "Washington"]);

interface PlaceMatch {
  country: string;
  stateOrUT?: string;
  matched: string;
  index: number;
}

interface CountryPattern {
  country: string;
  /** Case-sensitive/insensitive flags are baked into each regex. */
  re: RegExp;
}

// Ordered lists are matched by EARLIEST position in the phrase, not by list order.
const COUNTRY_PATTERNS: CountryPattern[] = [
  { country: "India", re: /\b(?:Republic of )?India\b|\bIndian law/i },
  { country: "United States", re: /\bUnited States\b|\bU\.S\.A?\.?(?=[\s,;)]|$)|\bUSA\b|\bfederal law of the United States/ },
  { country: "United Kingdom", re: /\bEngland\b|\bWales\b|\bScotland\b|\bNorthern Ireland\b|\bUnited Kingdom\b|\bU\.K\.|\bUK\b|\bGreat Britain\b/ },
  { country: "Canada", re: /\bCanada\b|\bOntario\b|\bBritish Columbia\b|\bAlberta\b|\bQuebec\b|\bQuébec\b/i },
  { country: "Australia", re: /\bAustralia\b|\bNew South Wales\b|\bQueensland\b|\bVictoria, Australia\b/i },
  { country: "Singapore", re: /\bSingapore\b/i },
  { country: "United Arab Emirates", re: /\bUnited Arab Emirates\b|\bUAE\b|\bDubai\b|\bAbu Dhabi\b/ },
  { country: "Ireland", re: /\bRepublic of Ireland\b|\bIreland\b/i },
  { country: "Germany", re: /\bGermany\b|\bGerman law\b/i },
  { country: "France", re: /\bFrance\b|\bFrench law\b/i },
  { country: "Netherlands", re: /\bNetherlands\b|\bDutch law\b/i },
  { country: "Switzerland", re: /\bSwitzerland\b|\bSwiss law\b/i },
  { country: "Hong Kong", re: /\bHong Kong\b/i },
  { country: "New Zealand", re: /\bNew Zealand\b/i },
  { country: "South Africa", re: /\bSouth Africa\b/i },
  { country: "Japan", re: /\bJapan\b|\bJapanese law\b/i },
  { country: "China", re: /\bPeople['’]s Republic of China\b|\bPRC\b/ },
];

/**
 * Resolves the earliest recognizable place in a free-text phrase such as
 * "the State of Delaware", "England and Wales", "Republic of India" or "Mumbai, Maharashtra".
 */
export function resolvePlace(phrase: string): PlaceMatch | null {
  const candidates: PlaceMatch[] = [];

  for (const { country, re } of COUNTRY_PATTERNS) {
    const m = phrase.match(re);
    if (m && m.index !== undefined) {
      candidates.push({ country, matched: m[0], index: m.index });
    }
  }

  for (const state of INDIAN_STATES_AND_UTS) {
    const m = phrase.match(new RegExp(`\\b${state}\\b`, "i"));
    if (m && m.index !== undefined) {
      candidates.push({ country: "India", stateOrUT: state, matched: m[0], index: m.index });
    }
  }

  for (const [state, cities] of Object.entries(INDIAN_STATE_CITY_MAP)) {
    for (const city of cities) {
      const m = phrase.match(new RegExp(`\\b${city}\\b`, "i"));
      if (m && m.index !== undefined) {
        candidates.push({ country: "India", stateOrUT: state, matched: m[0], index: m.index });
      }
    }
  }

  for (const state of US_STATES) {
    const pattern = AMBIGUOUS_US_STATE_NAMES.has(state)
      ? new RegExp(`\\b(?:State|Commonwealth) of ${state}\\b`, "i")
      : new RegExp(`\\b${state}\\b`, "i");
    const m = phrase.match(pattern);
    if (m && m.index !== undefined) {
      // "Indiana" must not be read as India, and "New York"/"Virginia" prefixes are handled by
      // the earliest-index rule plus the longer-name check below.
      candidates.push({ country: "United States", stateOrUT: state, matched: m[0], index: m.index });
    }
  }
  const dc = phrase.match(/\bDistrict of Columbia\b/);
  if (dc && dc.index !== undefined) {
    candidates.push({ country: "United States", stateOrUT: "District of Columbia", matched: dc[0], index: dc.index });
  }

  if (candidates.length === 0) return null;

  // Earliest match wins; ties prefer the more specific (state-bearing) match, then the longer text.
  candidates.sort((a, b) => {
    if (a.index !== b.index) return a.index - b.index;
    if (Boolean(a.stateOrUT) !== Boolean(b.stateOrUT)) return a.stateOrUT ? -1 : 1;
    return b.matched.length - a.matched.length;
  });

  const best = candidates[0];
  // If the winning match is a country and a state of that same country appears later, keep the state
  // ("Republic of India ... Maharashtra").
  if (!best.stateOrUT) {
    const sameCountryState = candidates.find((c) => c.country === best.country && c.stateOrUT);
    if (sameCountryState) best.stateOrUT = sameCountryState.stateOrUT;
  }
  return best;
}

/**
 * Detects jurisdiction context from document text, clauses, and metadata.
 */
export function detectJurisdiction(input: JurisdictionDetectionInput): JurisdictionContext {
  const text = (input.text || "").trim();
  const evidence: string[] = [];
  const ambiguityWarnings: string[] = [];

  let detectedCountry = "Unknown";
  let detectedStateOrUT: string | undefined = undefined;
  let governingLawSnippet: string | undefined = undefined;
  let confidence: JurisdictionConfidence = "unknown";
  let source: JurisdictionSource = "inferred";
  let governingLawClauseFoundButUnresolved = false;

  // Metadata-provided governing law is retained as a snippet, but it is only used to
  // establish the jurisdiction if the document text itself does not.
  if (input.metadata?.governingLaw) {
    governingLawSnippet = input.metadata.governingLaw;
    evidence.push(`Metadata specifies governing law: "${input.metadata.governingLaw}"`);
  }

  // 1. Governing Law & Choice of Law Clauses (explicit choice of law outranks everything else)
  const governingLawRegexes = [
    /(?:governed(?:\s+[a-zA-Z]+)?\s+by|construed(?:\s+[a-zA-Z]+)?\s+(?:in accordance with|under)|interpreted(?:\s+[a-zA-Z]+)?\s+(?:in accordance with|under)|subject to)\s+(?:the\s+)?(?:(?:substantive|internal|domestic)\s+)?laws? of\s+([^,.;\n\r]+)/i,
    /(?:governing law|applicable law|choice of law)\s*[:\-–]\s*([^\n\r.;]+)/i,
    /laws of (?:the\s+)?(?:Republic of\s+)?India/i,
    /laws of (?:the\s+)?State of\s+([A-Za-z\s]+)/i,
    /\bunder the laws of\s+([^,.;\n\r]+)/i,
  ];

  for (const regex of governingLawRegexes) {
    const match = text.match(regex);
    if (!match) continue;

    const matchedSnippet = match[0].trim();
    const capturedTarget = match[1] ? match[1].trim() : matchedSnippet;

    if (!governingLawSnippet || input.metadata?.governingLaw === governingLawSnippet) {
      governingLawSnippet = matchedSnippet;
    }
    evidence.push(`Governing law clause: "${matchedSnippet}"`);

    const place = resolvePlace(capturedTarget) || resolvePlace(matchedSnippet);
    if (place) {
      detectedCountry = place.country;
      detectedStateOrUT = place.stateOrUT;
      source = "document";
      confidence = "high";
    } else {
      governingLawClauseFoundButUnresolved = true;
    }
    break;
  }

  // 2. Exclusive Jurisdiction / Court / Venue Submissions
  const venueRegexes = [
    /(?:courts\s+(?:at|in|of)|exclusive jurisdiction of\s+(?:the\s+)?courts\s+(?:at|in|of))\s+([A-Za-z\s,]+?)(?:\s+shall|\s+will|\.|;|\n)/i,
    /(?:High Court of Judicature at\s+([A-Za-z\s]+)|High Court of\s+([A-Za-z\s]+))/i,
    /Court of Chancery of the State of Delaware/i,
    /Supreme Court of India/i,
  ];

  for (const regex of venueRegexes) {
    const match = text.match(regex);
    if (!match) continue;
    evidence.push(`Court & venue submission: "${match[0].trim()}"`);

    const place = resolvePlace(/chancery/i.test(match[0]) ? `${match[0]} Delaware` : match[0]);
    if (!place) continue;

    if (detectedCountry === "Unknown") {
      // No governing-law clause established a country: the venue is the best document-stated signal.
      detectedCountry = place.country;
      detectedStateOrUT = place.stateOrUT;
      source = "document";
      confidence = "medium";
    } else if (place.country === detectedCountry && !detectedStateOrUT && place.stateOrUT) {
      // Same country as the governing law: the venue refines it to a state.
      detectedStateOrUT = place.stateOrUT;
    }
    // A venue in a DIFFERENT country than the governing law never overrides it; it is noted below.
  }

  // 3. Indian Statutory & Regulatory Signals
  const indianStatuteSignals = [
    { pattern: /Indian Contract Act(?:,?\s*1872)?/i, name: "Indian Contract Act, 1872" },
    { pattern: /Arbitration and Conciliation Act(?:,?\s*1996)?/i, name: "Arbitration and Conciliation Act, 1996" },
    { pattern: /Payment of Gratuity Act/i, name: "Payment of Gratuity Act, 1972" },
    { pattern: /Employees['’]? Provident Funds?/i, name: "EPF & MP Act, 1952" },
    { pattern: /Copyright Act,?\s*1957/i, name: "Copyright Act, 1957" },
    { pattern: /Information Technology Act,?\s*2000/i, name: "Information Technology Act, 2000" },
    { pattern: /Companies Act,?\s*2013/i, name: "Companies Act, 2013" },
    { pattern: /Shops and Establishments Act/i, name: "Shops and Establishments Act" },
    { pattern: /Maharashtra Rent Control Act/i, name: "Maharashtra Rent Control Act, 1999" },
    { pattern: /Transfer of Property Act,?\s*1882/i, name: "Transfer of Property Act, 1882" },
    { pattern: /Registration Act,?\s*1908/i, name: "Registration Act, 1908" },
    { pattern: /Indian Stamp Act|Maharashtra Stamp Act/i, name: "Stamp Act" },
    { pattern: /Industrial Disputes Act/i, name: "Industrial Disputes Act, 1947" },
    { pattern: /Supreme Court of India/i, name: "Supreme Court of India" },
  ];

  let indianStatuteHits = 0;
  for (const sig of indianStatuteSignals) {
    if (sig.pattern.test(text)) {
      indianStatuteHits++;
      evidence.push(`Statutory reference: ${sig.name}`);
    }
  }

  if (indianStatuteHits > 0 && detectedCountry === "Unknown") {
    detectedCountry = "India";
    source = "inferred";
    confidence = indianStatuteHits >= 2 ? "medium" : "low";
  }

  // 4. US Statutory Signals
  const usStatuteSignals = [
    { pattern: /\b19 Del\. C\./i, name: "19 Del. C. (Delaware Code)" },
    { pattern: /Delaware General Corporation Law/i, name: "Delaware General Corporation Law (DGCL)" },
    { pattern: /Fair Labor Standards Act/i, name: "Fair Labor Standards Act (FLSA)" },
    { pattern: /\bUnited States Code\b|\b\d+\s+U\.S\.C\./i, name: "United States Code" },
    { pattern: /Uniform Commercial Code/i, name: "Uniform Commercial Code" },
    { pattern: /Title VII of the Civil Rights Act/i, name: "Title VII of the Civil Rights Act" },
  ];

  let usStatuteHits = 0;
  for (const sig of usStatuteSignals) {
    if (sig.pattern.test(text)) {
      usStatuteHits++;
      evidence.push(`US Statutory reference: ${sig.name}`);
    }
  }

  if (usStatuteHits > 0 && detectedCountry === "Unknown") {
    detectedCountry = "United States";
    source = "inferred";
    confidence = usStatuteHits >= 2 ? "medium" : "low";
  }

  // 5. UK Statutory Signals
  const ukStatuteSignals = [
    { pattern: /Employment Rights Act,?\s*1996/i, name: "Employment Rights Act 1996" },
    { pattern: /Companies Act,?\s*2006/i, name: "Companies Act 2006" },
    { pattern: /Data Protection Act,?\s*2018|UK GDPR/i, name: "UK data protection law" },
    { pattern: /Landlord and Tenant Act,?\s*19(?:54|85)|Housing Act,?\s*1988/i, name: "UK landlord & tenant legislation" },
  ];
  let ukStatuteHits = 0;
  for (const sig of ukStatuteSignals) {
    if (sig.pattern.test(text)) {
      ukStatuteHits++;
      evidence.push(`UK Statutory reference: ${sig.name}`);
    }
  }
  if (ukStatuteHits > 0 && detectedCountry === "Unknown") {
    detectedCountry = "United Kingdom";
    source = "inferred";
    confidence = ukStatuteHits >= 2 ? "medium" : "low";
  }

  // 6. Indian State/UT from city references & PIN codes. Only meaningful when India is the
  // detected country, or nothing else has been established.
  const indiaCanBeRefined = detectedCountry === "India" || detectedCountry === "Unknown";

  if (detectedCountry === "India" && !detectedStateOrUT) {
    for (const [state, cities] of Object.entries(INDIAN_STATE_CITY_MAP)) {
      const hit = cities.find((city) => new RegExp(`\\b${city}\\b`, "i").test(text));
      if (hit) {
        detectedStateOrUT = state;
        evidence.push(`Geographic reference: "${hit}" located in ${state}`);
        break;
      }
    }
  }

  // Indian PIN codes: six digits following an Indian place name / "PIN". A bare six-digit number
  // (invoice no., amount) is not evidence of anything.
  if (indiaCanBeRefined) {
    const placeNames = [
      ...Object.values(INDIAN_STATE_CITY_MAP).flat(),
      ...INDIAN_STATES_AND_UTS.map((s) => s.toLowerCase()),
      "india",
    ].map((p) => p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
    const pinRegex = new RegExp(
      `(?:\\bPIN(?:\\s*code)?\\s*[:\\-]?\\s*|\\b(?:${placeNames.join("|")})\\b[^\\n\\d]{0,20})(\\d{3}\\s?\\d{3})\\b`,
      "i"
    );
    const pinMatch = text.match(pinRegex);
    if (pinMatch) {
      const pin = pinMatch[1].replace(/\s/g, "");
      evidence.push(`Indian Postal Code (PIN): ${pin}`);
      if (detectedCountry === "Unknown") {
        detectedCountry = "India";
        if (confidence === "unknown") confidence = "low";
      }
      if (detectedCountry === "India" && !detectedStateOrUT) {
        const prefixToState: [string[], string][] = [
          [["400", "401", "402", "403", "410", "411", "412", "413", "414", "415", "416", "421", "422", "423", "424", "425", "431", "440"], "Maharashtra"],
          [["560", "561", "562", "570", "575", "580"], "Karnataka"],
          [["110"], "Delhi"],
          [["122", "121", "123"], "Haryana"],
          [["201", "226", "208", "201"], "Uttar Pradesh"],
          [["500", "501", "502"], "Telangana"],
          [["600", "601", "602", "603", "641"], "Tamil Nadu"],
          [["700", "711", "712"], "West Bengal"],
          [["380", "382", "390", "395"], "Gujarat"],
        ];
        const match = prefixToState.find(([prefixes]) => prefixes.includes(pin.slice(0, 3)));
        if (match) detectedStateOrUT = match[1];
      }
    }
  }

  // 7. Entity designations & currency tokens (weak, inferred-only signals)
  if (/\b(?:Private Limited|Pvt\.?\s*Ltd\.?)/i.test(text)) {
    evidence.push(`Indian corporate entity designation: "Private Limited"`);
    if (detectedCountry === "Unknown") {
      detectedCountry = "India";
      if (confidence === "unknown") confidence = "low";
    }
  }

  if (/₹|\bINR\b|\bRs\.?\s*\d|\b(?:Lakhs?|Crores?)\b/.test(text)) {
    evidence.push(`Indian currency denomination: INR (₹)`);
    if (detectedCountry === "Unknown") {
      detectedCountry = "India";
      if (confidence === "unknown") confidence = "low";
    }
  }

  if (/£|\bGBP\b/.test(text) && detectedCountry === "Unknown") {
    evidence.push(`Currency denomination: GBP (£)`);
    detectedCountry = "United Kingdom";
    if (confidence === "unknown") confidence = "low";
  }

  // 8. Last resort: AI-extracted metadata (only when the document text itself established nothing)
  if (detectedCountry === "Unknown") {
    const metaPlace =
      (input.metadata?.jurisdiction && resolvePlace(input.metadata.jurisdiction)) ||
      (input.metadata?.governingLaw && resolvePlace(input.metadata.governingLaw)) ||
      null;
    if (metaPlace) {
      detectedCountry = metaPlace.country;
      detectedStateOrUT = metaPlace.stateOrUT;
      source = "inferred";
      confidence = "low";
      evidence.push(`Extracted metadata indicates ${metaPlace.stateOrUT ? `${metaPlace.country} · ${metaPlace.stateOrUT}` : metaPlace.country}`);
    }
  }

  // 9. Ambiguity checks & calibration
  if (detectedCountry === "India" && usStatuteHits > 0) {
    ambiguityWarnings.push(
      "Document contains conflicting jurisdictional signals between Indian jurisdiction signals and US statutory provisions; review choice of law clause carefully."
    );
  }

  if (detectedCountry === "United States" && indianStatuteHits > 0) {
    ambiguityWarnings.push(
      "Document contains conflicting jurisdictional signals between United States legal context and Indian statutory references; clarify applicable forum."
    );
  }

  if (detectedCountry === "United Kingdom" && (indianStatuteHits > 0 || usStatuteHits > 0)) {
    ambiguityWarnings.push(
      "Document contains conflicting jurisdictional signals between United Kingdom legal context and other countries' statutory references; clarify applicable law."
    );
  }

  if (detectedCountry === "India" && !detectedStateOrUT) {
    ambiguityWarnings.push(
      "Governing law indicates India, but specific State or Union Territory venue is not specified."
    );
  }

  if (governingLawClauseFoundButUnresolved && detectedCountry === "Unknown") {
    ambiguityWarnings.push(
      "A governing-law clause was found, but the named jurisdiction could not be identified. Legal context requires confirming which law governs."
    );
  }

  if (detectedCountry === "Unknown") {
    ambiguityWarnings.push(
      "No definitive governing law, court submission, or statutory jurisdiction signals detected in the document text."
    );
  } else if (source === "inferred" && confidence !== "high") {
    ambiguityWarnings.push(
      `Jurisdiction is inferred based on textual signals (${evidence.length} detected) rather than an explicit choice-of-law clause.`
    );
  }

  if (detectedCountry === "Unknown") {
    confidence = "unknown";
  }

  return {
    country: detectedCountry,
    stateOrUT: detectedStateOrUT,
    governingLaw: governingLawSnippet,
    confidence,
    source,
    evidence: evidence.length > 0 ? evidence : ["No jurisdiction signals found in document text."],
    ambiguityWarnings: ambiguityWarnings.length > 0 ? ambiguityWarnings : undefined,
  };
}

/**
 * Applies a manual user override to the jurisdiction context.
 * User-provided jurisdiction takes precedence over inference.
 */
export function applyUserJurisdictionOverride(
  current: JurisdictionContext,
  override: { country: string; stateOrUT?: string; governingLaw?: string }
): JurisdictionContext {
  const previousEvidence = current.evidence || [];
  return {
    country: override.country.trim(),
    stateOrUT: override.stateOrUT ? override.stateOrUT.trim() : undefined,
    governingLaw: override.governingLaw || current.governingLaw,
    confidence: "high",
    source: "user",
    evidence: [
      `User manual override applied: ${override.country}${override.stateOrUT ? ` · ${override.stateOrUT}` : ""}`,
      ...previousEvidence,
    ],
    ambiguityWarnings: undefined,
  };
}

/**
 * Returns formatted jurisdiction badge string (e.g. "India · Maharashtra" or "United States · Delaware")
 */
export function formatJurisdictionBadge(ctx?: JurisdictionContext): string {
  if (!ctx || ctx.country === "Unknown") {
    return "Unknown Jurisdiction";
  }
  if (ctx.stateOrUT) {
    return `${ctx.country} · ${ctx.stateOrUT}`;
  }
  return ctx.country;
}

/**
 * Checks if a given jurisdiction context is India
 */
export function isIndianJurisdiction(ctx?: JurisdictionContext | string): boolean {
  if (!ctx) return false;
  if (typeof ctx === "string") {
    return /\b(?:india|maharashtra|mumbai|delhi|bengaluru|bangalore|karnataka|pune)\b/i.test(ctx);
  }
  return ctx.country.trim().toLowerCase() === "india";
}

/**
 * Checks if a given jurisdiction context is the United States (any state, or federal).
 */
export function isUnitedStatesJurisdiction(ctx?: JurisdictionContext | string): boolean {
  if (!ctx) return false;
  if (typeof ctx === "string") {
    const place = resolvePlace(ctx);
    return place?.country === "United States";
  }
  return ctx.country.trim().toLowerCase() === "united states";
}

/**
 * The single jurisdiction label every downstream consumer should use.
 * Prefers the structured context over free-text metadata, and NEVER invents a default: a report
 * whose jurisdiction could not be established says so instead of silently claiming India.
 */
export function getJurisdictionLabel(
  report:
    | {
        jurisdictionContext?: JurisdictionContext;
        jurisdiction?: JurisdictionContext;
        metadata?: { jurisdiction?: string | null; jurisdictionContext?: JurisdictionContext; governingLaw?: string | null };
      }
    | null
    | undefined
): string {
  const ctx = report?.jurisdictionContext || report?.jurisdiction || report?.metadata?.jurisdictionContext;
  if (ctx && ctx.country !== "Unknown") return formatJurisdictionBadge(ctx);
  const fromMeta = report?.metadata?.jurisdiction || report?.metadata?.governingLaw;
  return fromMeta && fromMeta.trim() ? fromMeta.trim() : "Unknown jurisdiction";
}

/**
 * Returns the resolved jurisdiction context of a report, or an explicit "Unknown" context.
 */
export function getReportJurisdiction(
  report:
    | {
        jurisdictionContext?: JurisdictionContext;
        jurisdiction?: JurisdictionContext;
        metadata?: { jurisdictionContext?: JurisdictionContext; governingLaw?: string | null };
      }
    | null
    | undefined
): JurisdictionContext {
  return (
    report?.jurisdictionContext ||
    report?.jurisdiction ||
    report?.metadata?.jurisdictionContext || {
      country: "Unknown",
      governingLaw: report?.metadata?.governingLaw || undefined,
      confidence: "unknown",
      source: "inferred",
      evidence: ["No jurisdiction signals found in document text."],
    }
  );
}

export type JurisdictionFamily = "india" | "united_states" | "other" | "unknown";

/** Coarse routing key used to decide which curated legal-source set may apply. */
export function getJurisdictionFamily(ctx?: JurisdictionContext | string): JurisdictionFamily {
  if (!ctx) return "unknown";
  if (typeof ctx === "string") {
    const place = resolvePlace(ctx);
    if (!place) return "unknown";
    return place.country === "India" ? "india" : place.country === "United States" ? "united_states" : "other";
  }
  const country = ctx.country.trim().toLowerCase();
  if (!country || country === "unknown") return "unknown";
  if (country === "india") return "india";
  if (country === "united states") return "united_states";
  return "other";
}
