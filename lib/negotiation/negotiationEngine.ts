import type {
  AnalysisReport,
  Clause,
  DocumentMetadata,
  EvidenceChain,
  Finding,
  LegalSource,
  NegotiationDraft,
  NegotiationGrounding,
  NegotiationLegalBasis,
  NegotiationTopic,
  SeverityLevel,
} from "@/types";
import { validateLegalSource } from "@/lib/safety/legalSourceValidator";
import { splitSentences } from "@/lib/utils";

/**
 * Negotiation Copilot — grounded, deterministic draft generator.
 *
 * Client-safe (no server imports), so it doubles as the offline fallback for the
 * /api/analysis/negotiate route. Grounding rules:
 * - Legal references come ONLY from the finding's Evidence Chain, and only when the source passes
 *   `validateLegalSource` and is verified / partially verified. Templates never name a statute,
 *   case, or regulation themselves.
 * - Numbers the user has to choose (caps, shorter periods) are written as [bracketed placeholders]
 *   so they cannot be mistaken for something the contract or the law says.
 * - Every draft carries NEGOTIATION_DRAFT_DISCLAIMER and a "verify before accepting" checklist.
 */

export const NEGOTIATION_DRAFT_DISCLAIMER =
  "Draft for review — not legal advice. LawPilot generated this wording from your document and the linked Evidence Chain. It has not been checked for legal correctness or enforceability, and it does not replace review by a qualified lawyer in your jurisdiction.";

/** Severities that justify opening the Negotiation Copilot (material findings). */
export const NEGOTIABLE_SEVERITIES: readonly SeverityLevel[] = [
  "critical_attention",
  "high_attention",
  "review",
];

export function isNegotiableSeverity(severity: SeverityLevel | string): boolean {
  return (NEGOTIABLE_SEVERITIES as readonly string[]).includes(severity);
}

const USABLE_VERIFICATION_STATUSES = new Set(["verified", "partially_verified"]);

export interface NegotiationEngineInput {
  documentId: string;
  finding: Finding;
  clause?: Clause | null;
  evidenceChain?: EvidenceChain | null;
  documentType?: DocumentMetadata["documentType"];
  parties?: DocumentMetadata["parties"];
  jurisdiction?: string | null;
}

// ─── Topic detection ──────────────────────────────────────────────────────

const TOPIC_PATTERNS: [NegotiationTopic, RegExp][] = [
  ["training_bond", /training|bond|reimburse|clawback|liquidated damages|early departure/i],
  ["non_compete", /non-?compete|restrictive covenant|restraint of trade|compet(e|ing)/i],
  ["intellectual_property", /intellectual property|\bip\b|invention|copyright|assign(ment)? of (all )?(rights|works)/i],
  ["dispute_resolution", /arbitrat|dispute resolution|jurisdiction of courts/i],
  ["notice_period", /notice period|resignation notice|days'? (advance )?(written )?notice|in lieu of notice/i],
  ["confidentiality", /confidential|trade secret|non-disclosure/i],
  ["liability", /indemn|liabilit|damages cap/i],
  ["termination", /terminat/i],
];

export function detectNegotiationTopic(finding: Finding, clause?: Clause | null): NegotiationTopic {
  // Title + category first: they describe the issue itself. The quote is a tiebreaker only, since a
  // single clause often mentions several topics (e.g. a bond clause that references notice).
  const primary = `${finding.title} ${finding.category}`;
  for (const [topic, pattern] of TOPIC_PATTERNS) {
    if (pattern.test(primary)) return topic;
  }
  const secondary = `${finding.description} ${finding.evidence?.quotedText || ""} ${clause?.title || ""}`;
  for (const [topic, pattern] of TOPIC_PATTERNS) {
    if (pattern.test(secondary)) return topic;
  }
  return "general";
}

// ─── Value extraction from the actual clause text ─────────────────────────

const NUMBER_WORDS = "(?:[a-z-]+\\s+)?";

export function extractAmount(text: string): string | undefined {
  const match = text.match(/(?:₹|Rs\.?|INR|USD|\$|€|£)\s*[\d,]+(?:\.\d+)?(?:\s*(?:lakh|crore))?/i);
  return match ? match[0].replace(/\s+/g, " ").trim() : undefined;
}

export function extractDuration(
  text: string,
  units: RegExp = /months?|years?|days?/i
): { value: number; unit: string; label: string } | undefined {
  // Handles "eighteen (18) months", "18 months", "90 calendar days".
  const pattern = new RegExp(
    `${NUMBER_WORDS}\\(?(\\d{1,4})\\)?\\s*(?:calendar\\s+|continuous\\s+|working\\s+)?(${units.source})\\b`,
    "i"
  );
  const match = text.match(pattern);
  if (!match) return undefined;
  const value = Number(match[1]);
  const unit = match[2].toLowerCase().replace(/s$/, "");
  return { value, unit, label: `${value} ${unit}${value === 1 ? "" : "s"}` };
}

// ─── Grounding ────────────────────────────────────────────────────────────

function isUsableSource(source: LegalSource): boolean {
  if (!USABLE_VERIFICATION_STATUSES.has(String(source.verificationStatus))) return false;
  return validateLegalSource(source).isValid;
}

export function buildNegotiationGrounding(
  finding: Finding,
  evidenceChain?: EvidenceChain | null,
  clause?: Clause | null
): NegotiationGrounding {
  const usableSources = (evidenceChain?.legalSources || []).filter(isUsableSource);

  const legalBasis: NegotiationLegalBasis[] = usableSources.map((source) => {
    const claim = evidenceChain?.legalClaims.find(
      (c) => c.sourceIds.includes(source.id) && c.supportLevel !== "unsupported"
    );
    return {
      sourceId: source.id,
      citation: source.citation,
      title: source.title,
      verificationStatus: source.verificationStatus,
      supportLevel: claim?.supportLevel,
      claim: claim?.claim || claim?.statement,
    };
  });

  const uncertainties = dedupe([
    ...(finding.uncertainties || []),
    ...(evidenceChain?.uncertainties || []),
    ...(evidenceChain?.legalClaims || []).flatMap((c) => c.uncertainties || []),
  ]);

  return {
    documentQuote:
      evidenceChain?.documentEvidence?.quotedText ||
      finding.evidence?.quotedText ||
      clause?.rawText?.slice(0, 400) ||
      "",
    section:
      evidenceChain?.documentEvidence?.section ||
      finding.evidence?.section ||
      clause?.section ||
      "Clause",
    pageNumber:
      evidenceChain?.documentEvidence?.pageNumber ??
      finding.evidence?.pageNumber ??
      clause?.pageNumber ??
      null,
    legalBasis,
    hasVerifiedAuthority: legalBasis.some((b) => b.verificationStatus === "verified"),
    evidenceChainId: evidenceChain?.id,
    uncertainties,
  };
}

// ─── Counterparty ─────────────────────────────────────────────────────────

const USER_SIDE_ROLES = /employee|tenant|lessee|contractor|consultant|freelancer|recipient|customer|licensee|borrower/i;

export function resolveRecipient(
  parties: DocumentMetadata["parties"] | undefined,
  documentType: DocumentMetadata["documentType"] | undefined
): string {
  const counterparty = (parties || []).find((p) => !USER_SIDE_ROLES.test(p.role || ""));
  if (documentType === "employment_agreement") {
    return counterparty ? `HR / Hiring Manager, ${counterparty.name}` : "HR / Hiring Manager";
  }
  return counterparty?.name || "the other party";
}

// ─── Topic playbooks (no legal authority is ever named here) ──────────────

interface Playbook {
  ask: string;
  proposedClause: string;
  rationale: string;
  fallback: string;
  messageAsk: string;
  topicChecks: string[];
}

function buildPlaybook(topic: NegotiationTopic, quote: string, section: string): Playbook {
  const amount = extractAmount(quote);
  const duration = extractDuration(quote);
  const amountText = amount || "the stated amount";

  switch (topic) {
    case "training_bond": {
      const months = duration && duration.unit === "month" ? duration.value : undefined;
      const periodText = months ? `${months} months` : "the stated period";
      return {
        ask: `limit the repayment to training costs the employer actually paid, and reduce it for every month you stay`,
        proposedClause: `If the Employee resigns before completing ${periodText} of continuous service, the Employee shall reimburse the Company only for documented, third-party training costs actually incurred on the Employee's specific training, up to a maximum of ${amountText}. This amount shall reduce on a pro-rata basis for each completed month of service${months ? ` (1/${months} per month)` : ""}. The Company shall provide copies of the relevant invoices before requesting any reimbursement, and no amount shall be deducted from salary or final settlement without the Employee's separate written consent.`,
        rationale: `Keeps the employer's legitimate interest in recovering real training spend, but ties the amount to evidence and to the time you have already served, instead of a fixed sum.`,
        fallback: `If a pro-rata reduction is refused, ask for (a) a lower cap of [amount you are comfortable with], (b) a shorter lock-in of [number] months, or (c) at minimum, that any recovery is limited to invoiced third-party costs and is never deducted from salary without your written consent.`,
        messageAsk: `Could we revise the repayment so it covers documented third-party training costs only, and reduces pro-rata for each month I complete${amount ? `, capped at ${amount}` : ""}?`,
        topicChecks: [
          "Ask for the actual training invoices or a written breakdown of what the amount covers.",
          "Confirm whether the reduction applies from the first month or only after a minimum period.",
          "Check whether any salary or final-settlement deduction still requires your written consent.",
        ],
      };
    }
    case "notice_period": {
      const current = extractDuration(quote, /days?|months?|weeks?/i);
      return {
        ask: `make the notice period shorter or mutual, and remove one-sided deductions in lieu of notice`,
        proposedClause: `Either party may terminate this employment by giving [number] days' prior written notice to the other party${current ? ` (in place of the current ${current.label})` : ""}. The Company may, at its discretion, accept a shorter notice period or waive it. Any payment in lieu of notice shall apply equally to both parties and shall be calculated on basic salary only, with any deduction itemised in the final settlement.`,
        rationale: `A mutual notice period with a clear, symmetrical payment-in-lieu rule reduces the risk of one-sided salary withholding when you leave.`,
        fallback: `If the length cannot change, ask that (a) the notice period is the same for both sides, (b) accrued leave can be set off against notice, and (c) any buy-out amount is calculated on basic salary and itemised in writing.`,
        messageAsk: `Could we make the notice period mutual at [number] days, with any payment in lieu of notice applying equally to both sides and calculated on basic salary?`,
        topicChecks: [
          "Confirm what salary components (basic vs. total) a notice buy-out would be calculated on.",
          "Check whether accrued leave can be adjusted against the notice period.",
          "Confirm the notice period that applies during probation, if different.",
        ],
      };
    }
    case "intellectual_property":
      return {
        ask: `limit the IP assignment to work created for the employer, and carve out personal and prior projects`,
        proposedClause: `The Employee assigns to the Company all rights in work product created in the course of employment, or using the Company's confidential information, equipment, or time ("Company Work Product"). Company Work Product does not include (a) inventions or works listed in Exhibit A (Prior Inventions), or (b) works created entirely on the Employee's own time, without Company resources or confidential information, that do not relate to the Company's actual or demonstrably anticipated business. Contributions to open-source projects under their existing licences are permitted where they do not disclose Company confidential information.`,
        rationale: `Protects the employer's ownership of work done for the job while keeping personal, off-duty, and pre-existing projects yours.`,
        fallback: `If a general carve-out is refused, ask that (a) a Prior Inventions schedule is attached and signed, and (b) specific personal or open-source projects you name are expressly excluded in writing.`,
        messageAsk: `Could we clarify the IP clause so it covers work done for the company, and exclude my listed prior projects and personal work done on my own time without company resources?`,
        topicChecks: [
          "List your existing personal projects and prior inventions before signing, and attach them as a schedule.",
          "Check whether a separate IT or open-source policy adds further restrictions.",
          "Confirm what counts as the company's 'anticipated business' in practice.",
        ],
      };
    case "non_compete": {
      const period = extractDuration(quote, /months?|years?/i);
      return {
        ask: `replace the broad post-employment non-compete with narrower protections the employer actually needs`,
        proposedClause: `For [number] months after employment ends, the Employee shall not solicit (a) any client the Employee personally dealt with in the last 12 months of employment, or (b) any employee of the Company to leave the Company. The Employee remains bound by the confidentiality obligations of this Agreement. No other restriction on the Employee's future employment or business activity applies after employment ends.`,
        rationale: `Non-solicitation plus confidentiality covers the employer's main concerns (clients, staff, information) without restricting where you can work next${period ? ` for ${period.label}` : ""}.`,
        fallback: `If some post-employment restriction must remain, ask that it is (a) shorter, e.g. [number] months, (b) limited to a short list of named direct competitors and your specific role, and (c) paid — with the company continuing [percentage]% of salary for any restricted period.`,
        messageAsk: `Could we replace the post-employment non-compete with a non-solicitation clause plus the existing confidentiality terms, which should protect the company's clients and information?`,
        topicChecks: [
          "Ask the employer which specific competitors or activities they are actually concerned about.",
          "Check whether the restriction applies even if the company terminates you.",
          "Confirm whether any restricted period would be paid.",
        ],
      };
    }
    case "dispute_resolution":
      return {
        ask: `make the dispute process neutral, with an arbitrator both sides agree on`,
        proposedClause: `Any dispute shall be referred to arbitration by a sole arbitrator appointed by mutual agreement of the parties or, failing agreement within 30 days, in accordance with the rules of [name of an independent arbitral institution]. The seat of arbitration shall be [city]. Each party shall bear its own legal costs, and the arbitrator's fees shall be [shared equally / borne by the Company].`,
        rationale: `A mutually agreed or institution-appointed arbitrator removes the appearance that one party controls who decides the dispute.`,
        fallback: `If institutional arbitration is refused, ask that the arbitrator is chosen from a panel of [three] names proposed by the company, from which you select one — and that the company bears the arbitrator's fees.`,
        messageAsk: `Could we update the dispute clause so the arbitrator is appointed by mutual agreement or by an independent institution, rather than by one party alone?`,
        topicChecks: [
          "Ask whether the company uses a standard arbitration institution for other contracts.",
          "Check who pays arbitration fees and where hearings would take place.",
          "Confirm whether small claims or statutory employment forums remain available.",
        ],
      };
    case "confidentiality":
      return {
        ask: `define confidential information precisely and add the standard exclusions`,
        proposedClause: `"Confidential Information" means non-public information of the Company disclosed to the Employee in the course of employment and marked or reasonably understood to be confidential. It excludes information that (a) is or becomes public other than through the Employee's breach, (b) was lawfully known to the Employee before disclosure, (c) is independently developed without use of Confidential Information, or (d) is required to be disclosed by law or court order, after prompt notice to the Company where permitted. The general skills and experience of the Employee are not Confidential Information.`,
        rationale: `A precise definition with standard exclusions keeps the obligation workable and avoids it being read as a restriction on your general skills.`,
        fallback: `If the definition cannot change, ask for a written confirmation that general skills, knowledge, and publicly available information are not covered.`,
        messageAsk: `Could we tighten the definition of confidential information and add the usual exclusions for public information, prior knowledge, and general skills?`,
        topicChecks: [
          "Check how long the confidentiality obligation lasts after you leave.",
          "Confirm whether trade secrets are treated differently from other confidential information.",
        ],
      };
    case "liability":
      return {
        ask: `cap your liability and make indemnities mutual and fault-based`,
        proposedClause: `Each party's total liability under this Agreement shall not exceed [cap, e.g. fees paid in the previous 12 months], except for liability arising from fraud or wilful misconduct. Each party shall indemnify the other only for losses caused by its own breach or negligence, and neither party is liable for indirect or consequential losses.`,
        rationale: `A cap and a fault-based, mutual indemnity keep your exposure proportionate to your role and your fees.`,
        fallback: `If a mutual cap is refused, ask for (a) a cap on your side only, or (b) an exclusion of indirect and consequential losses.`,
        messageAsk: `Could we add a liability cap and make the indemnity mutual and limited to losses caused by each party's own breach?`,
        topicChecks: [
          "Check whether you hold (or are required to hold) insurance that covers this liability.",
          "Confirm which losses the other party is most concerned about.",
        ],
      };
    case "termination":
      return {
        ask: `make termination rights balanced and clearly defined`,
        proposedClause: `Either party may terminate this Agreement (a) on [number] days' written notice, or (b) immediately on written notice if the other party commits a material breach that is not remedied within [number] days of written notice describing it. On termination, all amounts earned up to the termination date shall be paid within [number] days.`,
        rationale: `Symmetrical rights, a cure period, and a clear payment timeline reduce the risk of an abrupt, one-sided termination.`,
        fallback: `If rights cannot be made mutual, ask for a cure period before termination for breach and a written statement of reasons.`,
        messageAsk: `Could we make the termination rights mutual, add a cure period for breaches, and set a clear timeline for final payments?`,
        topicChecks: [
          "Confirm what counts as 'cause' or 'material breach' in this agreement.",
          "Check what happens to accrued amounts or benefits on termination.",
        ],
      };
    default:
      return {
        ask: `clarify this clause in writing and make it more balanced`,
        proposedClause: `[Revised ${section}: restate the obligation in specific, measurable terms, make it apply to both parties where appropriate, and state any conditions, limits, or caps expressly.]`,
        rationale: `Specific, mutual wording reduces the room for a one-sided interpretation later.`,
        fallback: `If the wording cannot change, ask for a written clarification (email or side letter) confirming how the clause will be applied in practice.`,
        messageAsk: `Could we clarify ${section} so its scope and limits are stated expressly, and apply equally to both parties where relevant?`,
        topicChecks: ["Ask for concrete examples of how the other party would apply this clause."],
      };
  }
}

// ─── Draft assembly ───────────────────────────────────────────────────────

function dedupe(items: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of items) {
    const item = raw?.trim();
    if (!item) continue;
    const key = item.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}

function firstSentence(text: string): string {
  return splitSentences(text.trim())[0] ?? "";
}

function cleanTitle(title: string): string {
  return title.replace(/^(Potential|Finding:|Risk:)\s*/i, "").trim();
}

export function buildVerifyChecklist(
  topicChecks: string[],
  grounding: NegotiationGrounding,
  jurisdiction?: string | null
): string[] {
  const where = jurisdiction?.trim() ? ` licensed in ${jurisdiction.trim()}` : " in your jurisdiction";
  const authorityCheck = grounding.hasVerifiedAuthority
    ? "Confirm with a lawyer that the linked legal sources apply to your facts — the Evidence Chain shows context, not a ruling on this clause."
    : "No verified legal source is linked to this finding — do not rely on this draft for any legal position without a lawyer's review.";

  return dedupe([
    ...grounding.uncertainties.slice(0, 3),
    ...topicChecks,
    authorityCheck,
    `Have the revised wording reviewed by a qualified lawyer${where} before you accept or sign it.`,
    "Make sure any agreed change appears in the final signed agreement (or a signed amendment), not only in email.",
  ]).slice(0, 8);
}

export function generateNegotiationDraft(input: NegotiationEngineInput): NegotiationDraft {
  const { finding, clause, evidenceChain } = input;
  const grounding = buildNegotiationGrounding(finding, evidenceChain, clause);
  const topic = detectNegotiationTopic(finding, clause);
  const playbook = buildPlaybook(topic, grounding.documentQuote || clause?.rawText || "", grounding.section);
  const recipient = resolveRecipient(input.parties, input.documentType);
  const title = cleanTitle(finding.title);
  const sectionRef = grounding.pageNumber
    ? `${grounding.section} (page ${grounding.pageNumber})`
    : grounding.section;

  const whyItMatters = finding.whyItMatters || finding.description;
  const issueExplanation = [
    `${sectionRef} ${firstSentence(finding.description || finding.summary || title).replace(/^Section \d+[a-z]?\s*/i, "").replace(/^./, (c) => c.toLowerCase())}`,
    whyItMatters ? firstSentence(whyItMatters) : "",
    `The negotiation goal is to ${playbook.ask}.`,
  ]
    .filter(Boolean)
    .join(" ");

  const body = [
    `Hello,`,
    ``,
    `Thank you for sharing the agreement. Before signing, I'd like to raise one point in ${sectionRef}.`,
    ``,
    playbook.messageAsk,
    ``,
    `I've included suggested wording below as a starting point for discussion — I'm happy to consider alternatives that address the same concern.`,
    ``,
    `Suggested wording (draft):`,
    `"${playbook.proposedClause}"`,
    ``,
    `Thank you, and I look forward to your thoughts.`,
    ``,
    `Best regards,`,
    `[Your name]`,
  ].join("\n");

  return {
    id: `negotiation-${input.documentId}-${finding.id}`,
    documentId: input.documentId,
    findingId: finding.id,
    findingTitle: title,
    clauseId: finding.clauseId || finding.evidence?.clauseId || clause?.id || "",
    clauseSection: grounding.section,
    pageNumber: grounding.pageNumber,
    severity: finding.severity,
    topic,
    issueExplanation,
    proposedClause: playbook.proposedClause,
    proposedClauseRationale: playbook.rationale,
    fallbackPosition: playbook.fallback,
    message: {
      recipient,
      subject: `Request to revise ${grounding.section} before signing`,
      body,
    },
    verifyBeforeAccepting: buildVerifyChecklist(playbook.topicChecks, grounding, input.jurisdiction),
    grounding,
    generationMode: "grounded_template",
    disclaimer: NEGOTIATION_DRAFT_DISCLAIMER,
    generatedAt: new Date().toISOString(),
  };
}

// ─── Citation guard (used to vet AI-assisted text) ────────────────────────

const STATUTE_PATTERN =
  /\b(?:[A-Z][\w()&'.-]*\s+){1,8}(?:Act|Code|Regulations?|Rules|Ordinance),?\s*(?:of\s+)?\d{4}\b/g;
const CASE_PATTERN = /\b([A-Z][\w.&'-]*)\s+v(?:s)?\.\s+([A-Z][\w.&'-]*)/g;
const REPORTER_PATTERN = /\(\d{4}\)\s*\d+\s*(?:SCC|SCR|AIR|U\.S\.|F\.\d?d|All ER|WLR)\b(?:\s*\d+)?/g;
const SECTION_SYMBOL_PATTERN = /§+\s*\d+[A-Za-z]?/g;

function normalizeForMatch(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

/**
 * Returns every citation-like reference in `text` that does not appear in the allowed Evidence
 * Chain sources. An empty array means the text introduces no new legal authority.
 */
export function findUngroundedCitations(text: string, allowed: NegotiationLegalBasis[]): string[] {
  const haystack = ` ${allowed.map((a) => normalizeForMatch(`${a.citation} ${a.title}`)).join(" | ")} `;
  const has = (needle: string) => needle.length > 0 && haystack.includes(` ${needle} `);
  const violations: string[] = [];

  // Statutes: the greedy match may include lead-in words ("Under the Indian Contract Act, 1872"),
  // so accept it if any trailing run of 3+ words (e.g. "indian contract act 1872") is allowed.
  for (const match of text.matchAll(STATUTE_PATTERN)) {
    const words = normalizeForMatch(match[0]).split(" ");
    let grounded = false;
    for (let i = 0; i <= words.length - 3 && !grounded; i++) {
      grounded = has(words.slice(i).join(" "));
    }
    if (!grounded) violations.push(match[0].trim());
  }

  // Cases: compare the party names adjacent to "v." (e.g. "associates v delhi"), or accept a
  // short-form reference whose first party appears in an allowed case name ("Percept D'Mark v. …").
  const allowedFirstParties = allowed
    .map((a) => normalizeForMatch(a.citation).split(" v ")[0])
    .filter((firstParty, i) => normalizeForMatch(allowed[i].citation).includes(" v "));
  for (const match of text.matchAll(CASE_PATTERN)) {
    const left = normalizeForMatch(match[1]);
    const grounded =
      has(normalizeForMatch(`${match[1]} v ${match[2]}`)) ||
      allowedFirstParties.some((firstParty) => ` ${firstParty} `.includes(` ${left} `));
    if (!grounded) violations.push(match[0].trim());
  }

  for (const pattern of [REPORTER_PATTERN, SECTION_SYMBOL_PATTERN]) {
    for (const match of text.matchAll(pattern)) {
      if (!has(normalizeForMatch(match[0]))) violations.push(match[0].trim());
    }
  }

  return dedupe(violations);
}

// ─── Report adapter ───────────────────────────────────────────────────────

/**
 * Resolves the finding, its clause, and its Evidence Chain from a report, using the same matching
 * rules as the finding presentation layer. Returns null if the finding is not in the report.
 */
export function buildNegotiationInputFromReport(
  report: AnalysisReport,
  findingId: string
): NegotiationEngineInput | null {
  const finding = report.findings.find((f) => f.id === findingId);
  if (!finding) return null;

  const clause =
    report.clauses.find((c) => c.id === finding.clauseId || c.id === finding.evidence?.clauseId) || null;
  const evidenceChain =
    report.evidenceChains.find(
      (chain) =>
        chain.finding.id === finding.id ||
        chain.finding.clauseId === finding.clauseId ||
        chain.id === finding.id
    ) || null;

  const jc = report.jurisdictionContext || report.metadata.jurisdictionContext;
  const jurisdiction =
    [jc?.stateOrUT, jc?.country].filter(Boolean).join(", ") ||
    report.metadata.jurisdiction ||
    report.metadata.governingLaw ||
    null;

  return {
    documentId: report.documentId || report.id,
    finding,
    clause,
    evidenceChain,
    documentType: report.metadata.documentType,
    parties: report.metadata.parties,
    jurisdiction,
  };
}
