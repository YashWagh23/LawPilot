import type { DocumentType } from "@/types";

/**
 * Lightweight, deterministic document-type classifier.
 *
 * Downstream logic (risk findings, action plans, compare narratives, Ask) must branch on the
 * document type instead of assuming the upload is an employment agreement, which is what the
 * flagship demo happens to be.
 */

interface TypeSignal {
  type: DocumentType;
  /** Matches in the first part of the document (title/preamble) weigh more than body matches. */
  titleRe?: RegExp;
  bodyRe: RegExp[];
}

const SIGNALS: TypeSignal[] = [
  {
    type: "employment_agreement",
    titleRe: /employment|offer of employment|appointment letter/i,
    bodyRe: [
      /\bthe employee\b/gi,
      /\bemployer\b/gi,
      /\bprobation(?:ary)?\b/gi,
      /\bresign(?:ation|s)?\b/gi,
      /\bsalary\b|\bCTC\b|\bcost[- ]to[- ]company\b/gi,
    ],
  },
  {
    type: "independent_contractor",
    titleRe: /independent contractor|consultan(?:t|cy)|freelanc/i,
    bodyRe: [/\bindependent contractor\b/gi, /\bconsultant\b/gi, /\bcontractor\b/gi, /\bdeliverables?\b/gi],
  },
  {
    type: "nda",
    titleRe: /non[- ]disclosure|confidentiality agreement|\bNDA\b/i,
    bodyRe: [/\bdisclosing party\b/gi, /\breceiving party\b/gi, /\bconfidential information\b/gi],
  },
  {
    type: "lease_residential",
    titleRe: /residential|leave and licen[cs]e|rental agreement|tenancy/i,
    bodyRe: [/\btenant\b/gi, /\blandlord\b/gi, /\blicen[sc]or\b/gi, /\blicensee\b/gi, /\bsecurity deposit\b/gi, /\bapartment\b|\bflat\b|\bdwelling\b/gi],
  },
  {
    type: "lease_commercial",
    titleRe: /commercial lease|office lease|retail lease/i,
    bodyRe: [/\btenant\b/gi, /\blandlord\b/gi, /\bpremises\b/gi, /\bcommon area\b/gi, /\block-?in period\b/gi],
  },
  {
    type: "services_agreement",
    titleRe: /services agreement|master services|service level|statement of work|subscription|software (?:as a service|license)|saas/i,
    bodyRe: [/\bservices\b/gi, /\bservice provider\b/gi, /\bcustomer\b/gi, /\bstatement of work\b/gi, /\bsubscription\b/gi, /\bservice levels?\b/gi],
  },
];

function count(re: RegExp, text: string): number {
  return (text.match(re) || []).length;
}

export function classifyDocumentType(text: string, fileName = ""): DocumentType {
  const head = `${fileName}\n${text.slice(0, 1500)}`;
  const body = text.slice(0, 20_000);

  let bestType: DocumentType = "general_contract";
  let bestScore = 0;

  for (const signal of SIGNALS) {
    let score = 0;
    if (signal.titleRe && signal.titleRe.test(head)) score += 8;
    for (const re of signal.bodyRe) score += Math.min(count(re, body), 6);
    if (score > bestScore) {
      bestScore = score;
      bestType = signal.type;
    }
  }

  // A lease/licence is commercial when it talks about business premises and not a dwelling.
  if (bestType === "lease_residential" || bestType === "lease_commercial") {
    const residential = count(/\bapartment\b|\bflat\b|\bdwelling\b|\bresidential\b|\bresiding\b/gi, body);
    const commercial = count(/\bcommercial\b|\boffice\b|\bshop\b|\bretail\b|\bbusiness premises\b|\bcommon area maintenance\b/gi, body);
    bestType = commercial > residential ? "lease_commercial" : "lease_residential";
  }

  // Weak evidence → do not guess a specific type.
  return bestScore >= 8 ? bestType : "general_contract";
}

export function isEmploymentType(type: DocumentType | undefined | null): boolean {
  return type === "employment_agreement";
}

export function isLeaseType(type: DocumentType | undefined | null): boolean {
  return type === "lease_residential" || type === "lease_commercial";
}

const TYPE_LABELS: Record<DocumentType, string> = {
  employment_agreement: "employment agreement",
  independent_contractor: "independent contractor agreement",
  nda: "non-disclosure agreement",
  lease_commercial: "commercial lease",
  lease_residential: "residential lease or licence",
  services_agreement: "services agreement",
  general_contract: "agreement",
};

export function documentTypeLabel(type: DocumentType | undefined | null): string {
  return TYPE_LABELS[type ?? "general_contract"] ?? "agreement";
}
