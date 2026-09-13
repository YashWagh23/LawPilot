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
 */

import { Clause, DocumentMetadata, JurisdictionConfidence, JurisdictionContext, JurisdictionSource } from "@/types";

export interface JurisdictionDetectionInput {
  text: string;
  clauses?: Clause[];
  metadata?: Partial<DocumentMetadata>;
}

/**
 * Common Indian States and Union Territories with known commercial hubs
 */
const INDIAN_STATE_CITY_MAP: Record<string, string[]> = {
  Maharashtra: ["mumbai", "pune", "nagpur", "thane", "navi mumbai", "bkc", "bandra"],
  Karnataka: ["bengaluru", "bangalore", "mysuru", "mysore"],
  Delhi: ["new delhi", "delhi", "ncr"],
  Haryana: ["gurugram", "gurgaon", "faridabad"],
  "Uttar Pradesh": ["noida", "greater noida", "lucknow", "kanpur"],
  Telangana: ["hyderabad", "secunderabad", "cyberabad"],
  "Tamil Nadu": ["chennai", "madras", "coimbatore"],
  "West Bengal": ["kolkata", "calcutta"],
  Gujarat: ["ahmedabad", "gandhinagar", "vadodara", "surat"],
};

/**
 * Detects jurisdiction context from document text, clauses, and metadata.
 */
export function detectJurisdiction(input: JurisdictionDetectionInput): JurisdictionContext {
  const text = (input.text || "").trim();
  const lowerText = text.toLowerCase();
  const evidence: string[] = [];
  const ambiguityWarnings: string[] = [];

  let detectedCountry = "Unknown";
  let detectedStateOrUT: string | undefined = undefined;
  let governingLawSnippet: string | undefined = undefined;
  let confidence: JurisdictionConfidence = "unknown";
  let source: JurisdictionSource = "inferred";

  // Check metadata overrides if provided
  if (input.metadata?.governingLaw) {
    governingLawSnippet = input.metadata.governingLaw;
    evidence.push(`Metadata specifies governing law: "${input.metadata.governingLaw}"`);
  }

  // 1. Governing Law & Choice of Law Clauses
  const governingLawRegexes = [
    /(?:governed(?:\s+[a-zA-Z]+)?\s+by|construed(?:\s+[a-zA-Z]+)?\s+in accordance with|subject to)\s+(?:the\s+)?laws of\s+([^,.;\n\r]+)/i,
    /(?:governing law|applicable law)\s*[:\-–]\s*([^\n\r.;]+)/i,
    /laws of (?:the\s+)?(?:Republic of\s+)?India/i,
    /laws of (?:the\s+)?State of\s+([A-Za-z\s]+)/i,
  ];

  for (const regex of governingLawRegexes) {
    const match = text.match(regex);
    if (match) {
      const matchedSnippet = match[0].trim();
      const capturedTarget = match[1] ? match[1].trim() : matchedSnippet;

      if (!governingLawSnippet) {
        governingLawSnippet = matchedSnippet;
      }
      evidence.push(`Governing law clause: "${matchedSnippet}"`);

      // Check if India
      if (/(?:Republic of\s+)?India/i.test(capturedTarget) || /laws of (?:the\s+)?(?:Republic of\s+)?India/i.test(matchedSnippet) || /India/i.test(capturedTarget)) {
        detectedCountry = "India";
        source = "document";
        confidence = "high";
      } else if (/Delaware/i.test(capturedTarget) || /Delaware/i.test(matchedSnippet)) {
        detectedCountry = "United States";
        detectedStateOrUT = "Delaware";
        source = "document";
        confidence = "high";
      } else if (/California/i.test(capturedTarget)) {
        detectedCountry = "United States";
        detectedStateOrUT = "California";
        source = "document";
        confidence = "high";
      } else if (/New York/i.test(capturedTarget)) {
        detectedCountry = "United States";
        detectedStateOrUT = "New York";
        source = "document";
        confidence = "high";
      } else if (/England|Wales|United Kingdom|UK/i.test(capturedTarget)) {
        detectedCountry = "United Kingdom";
        source = "document";
        confidence = "high";
      }
      break;
    }
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
    if (match) {
      evidence.push(`Court & venue submission: "${match[0].trim()}"`);
      const venueStr = match[0].toLowerCase();

      if (venueStr.includes("mumbai") || venueStr.includes("bombay") || venueStr.includes("pune")) {
        if (detectedCountry === "Unknown") detectedCountry = "India";
        detectedStateOrUT = "Maharashtra";
        if (confidence !== "high") confidence = "medium";
      } else if (venueStr.includes("bengaluru") || venueStr.includes("bangalore")) {
        if (detectedCountry === "Unknown") detectedCountry = "India";
        detectedStateOrUT = "Karnataka";
        if (confidence !== "high") confidence = "medium";
      } else if (venueStr.includes("delhi")) {
        if (detectedCountry === "Unknown") detectedCountry = "India";
        detectedStateOrUT = "Delhi";
        if (confidence !== "high") confidence = "medium";
      } else if (venueStr.includes("chancery") || venueStr.includes("delaware")) {
        detectedCountry = "United States";
        detectedStateOrUT = "Delaware";
        if (confidence !== "high") confidence = "medium";
      }
    }
  }

  // 3. Indian Statutory & Regulatory Signals
  const indianStatuteSignals = [
    { pattern: /Indian Contract Act(?:,\s*1872)?/i, name: "Indian Contract Act, 1872" },
    { pattern: /Arbitration and Conciliation Act(?:,\s*1996)?/i, name: "Arbitration and Conciliation Act, 1996" },
    { pattern: /Payment of Gratuity Act/i, name: "Payment of Gratuity Act, 1972" },
    { pattern: /Employees'? Provident Funds/i, name: "EPF & MP Act, 1952" },
    { pattern: /Copyright Act(?:,\s*1957)?/i, name: "Copyright Act, 1957" },
    { pattern: /Information Technology Act(?:,\s*2000)?/i, name: "Information Technology Act, 2000" },
    { pattern: /Companies Act(?:,\s*2013)?/i, name: "Companies Act, 2013" },
    { pattern: /Shops and Establishments Act/i, name: "Shops and Establishments Act" },
    { pattern: /Supreme Court of India/i, name: "Supreme Court of India" },
  ];

  let indianStatuteHits = 0;
  for (const sig of indianStatuteSignals) {
    if (sig.pattern.test(text)) {
      indianStatuteHits++;
      evidence.push(`Statutory reference: ${sig.name}`);
    }
  }

  if (indianStatuteHits > 0) {
    if (detectedCountry === "Unknown") {
      detectedCountry = "India";
      source = "inferred";
      confidence = indianStatuteHits >= 2 ? "medium" : "low";
    }
  }

  // 4. US Statutory Signals
  const usStatuteSignals = [
    { pattern: /19 Del\. C\./i, name: "19 Del. C. (Delaware Code)" },
    { pattern: /Delaware General Corporation Law/i, name: "Delaware General Corporation Law (DGCL)" },
    { pattern: /Fair Labor Standards Act/i, name: "Fair Labor Standards Act (FLSA)" },
    { pattern: /United States Code/i, name: "United States Code" },
  ];

  let usStatuteHits = 0;
  for (const sig of usStatuteSignals) {
    if (sig.pattern.test(text)) {
      usStatuteHits++;
      evidence.push(`US Statutory reference: ${sig.name}`);
    }
  }

  if (usStatuteHits > 0) {
    if (detectedCountry === "Unknown") {
      detectedCountry = "United States";
      source = "inferred";
      confidence = usStatuteHits >= 2 ? "medium" : "low";
    }
  }

  // 5. Detect Indian State/UT from city references & PIN codes
  if (detectedCountry === "India" && !detectedStateOrUT) {
    for (const [state, cities] of Object.entries(INDIAN_STATE_CITY_MAP)) {
      for (const city of cities) {
        if (lowerText.includes(city)) {
          detectedStateOrUT = state;
          evidence.push(`Geographic reference: "${city}" located in ${state}`);
          break;
        }
      }
      if (detectedStateOrUT) break;
    }
  }

  // Indian PIN codes (6 digits, e.g., 400051, 411001)
  const pinCodeMatch = text.match(/\b(400\d{3}|411\d{3}|560\d{3}|110\d{3}|122\d{3}|201\d{3}|500\d{3}|600\d{3}|700\d{3}|380\d{3})\b/);
  if (pinCodeMatch) {
    const pin = pinCodeMatch[1];
    evidence.push(`Indian Postal Code (PIN): ${pin}`);
    if (detectedCountry === "Unknown") {
      detectedCountry = "India";
      if (confidence === "unknown") confidence = "low";
    }
    if (!detectedStateOrUT) {
      if (pin.startsWith("400") || pin.startsWith("411")) detectedStateOrUT = "Maharashtra";
      else if (pin.startsWith("560")) detectedStateOrUT = "Karnataka";
      else if (pin.startsWith("110")) detectedStateOrUT = "Delhi";
      else if (pin.startsWith("122")) detectedStateOrUT = "Haryana";
      else if (pin.startsWith("201")) detectedStateOrUT = "Uttar Pradesh";
      else if (pin.startsWith("500")) detectedStateOrUT = "Telangana";
      else if (pin.startsWith("600")) detectedStateOrUT = "Tamil Nadu";
      else if (pin.startsWith("700")) detectedStateOrUT = "West Bengal";
      else if (pin.startsWith("380")) detectedStateOrUT = "Gujarat";
    }
  }

  // Entity designations & currency tokens
  if (/Private Limited|Pvt\.?\s*Ltd\.?/i.test(text)) {
    evidence.push(`Indian corporate entity designation: "Private Limited"`);
    if (detectedCountry === "Unknown") {
      detectedCountry = "India";
      if (confidence === "unknown") confidence = "low";
    }
  }

  if (/[₹]|INR\b|Rs\.?\s*\d|Lakhs?|Crores?/i.test(text)) {
    evidence.push(`Indian currency denomination: INR (₹)`);
  }

  // 6. Ambiguity checks & calibration
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

  if (detectedCountry === "India" && !detectedStateOrUT) {
    ambiguityWarnings.push(
      "Governing law indicates India, but specific State or Union Territory venue is not specified."
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

  // Default fallback if still unknown
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
    return /india|maharashtra|mumbai|delhi|bengaluru|karnataka|pune/i.test(ctx);
  }
  return ctx.country.toLowerCase() === "india";
}
