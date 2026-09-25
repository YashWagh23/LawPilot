import type {
  ActionPlanItem,
  ChangeSignificance,
  ChangeType,
  Clause,
  ClauseCategory,
  ClauseComparisonItem,
  DocumentType,
  ImpactCategory,
  SemanticDiffDetail,
} from "@/types";
import type { MatchedClausePair } from "./clauseMatcher";
import {
  describeDurationChange,
  describeMoneyChange,
  extractDurations,
  extractMoneyAmounts,
  formatDuration,
  formatMoney,
  type Duration,
  type MoneyAmount,
} from "@/lib/documents/measures";
import { resolvePlace } from "@/lib/jurisdiction/jurisdictionDetector";

/**
 * Context that decides which narrative may be shown. India-specific statutory commentary only for
 * an Indian-governed agreement; employee/HR framing only for an employment agreement.
 */
export interface CompareContext {
  isIndian: boolean;
  documentType?: DocumentType;
}

function toContext(ctx: boolean | CompareContext | undefined): CompareContext {
  if (typeof ctx === "boolean") return { isIndian: ctx };
  return ctx ?? { isIndian: true };
}

type Direction = "increase" | "decrease" | "neutral";

/** Normalizes text for strict identical comparison (strips excessive whitespace) */
function normalizeTextForComparison(text: string): string {
  return text.replace(/\r\n/g, "\n").replace(/\s+/g, " ").trim();
}

/** Strips punctuation to check for wording-only or punctuation-only differences */
function stripPunctuation(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, "").replace(/\s+/g, " ").trim();
}

// ────────────────────────────────────────────────────────────────────────────
// Unit-aware measurement diffing
// ────────────────────────────────────────────────────────────────────────────

type DurationKind = "notice" | "probation" | "restriction" | "cure" | "payment_term" | "tenure";

const DURATION_KINDS: { kind: DurationKind; re: RegExp; parameter: string; impact: ImpactCategory; label: string }[] = [
  { kind: "notice", re: /\bnotice\b/i, parameter: "Notice Period", impact: "timing", label: "Notice Window" },
  { kind: "probation", re: /\bprobation|\bevaluation period\b/i, parameter: "Probation Period", impact: "timing", label: "Probation Window" },
  { kind: "restriction", re: /\bfollowing (?:the )?termination|\bafter (?:leaving|termination)|\bnon-?compet|\bnon-?solicit|\brestrict/i, parameter: "Restriction Duration", impact: "legal", label: "Restriction Period" },
  { kind: "cure", re: /\bcure\b|\bremed(?:y|ied)\b|\brectif/i, parameter: "Cure Period", impact: "timing", label: "Cure Period" },
  { kind: "payment_term", re: /\binvoice\b|\bpayable within\b|\bdue within\b|\bnet\s*\d+/i, parameter: "Payment Term", impact: "timing", label: "Payment Deadline" },
  { kind: "tenure", re: /\bwithin\b|\bcompleting\b|\bminimum\b|\block-?in\b|\bterm of\b|\bcontinuous\b/i, parameter: "Commitment / Tenure Threshold", impact: "timing", label: "Tenure Horizon" },
];

/** Assigns each duration to the closest keyword group in its 90-char neighbourhood. */
function categorizeDurations(text: string): Map<DurationKind, Duration> {
  const found = new Map<DurationKind, Duration>();
  for (const d of extractDurations(text)) {
    const windowText = text.slice(Math.max(0, d.index - 90), d.index + d.raw.length + 90);
    let best: { kind: DurationKind; dist: number } | null = null;
    for (const k of DURATION_KINDS) {
      const m = k.re.exec(windowText);
      if (!m) continue;
      const dist = Math.abs(m.index - (d.index - Math.max(0, d.index - 90)));
      if (!best || dist < best.dist) best = { kind: k.kind, dist };
    }
    if (best && !found.has(best.kind)) found.set(best.kind, d);
  }
  return found;
}

type MoneyKind = "reimbursement" | "penalty" | "deposit" | "salary" | "fee" | "other";

const MONEY_KIND_HINTS: { kind: MoneyKind; re: RegExp }[] = [
  { kind: "reimbursement", re: /reimburs|repay|clawback|training/i },
  { kind: "penalty", re: /liquidated|penalt|forfeit|late (?:fee|charge)|default interest/i },
  { kind: "deposit", re: /deposit|advance/i },
  { kind: "salary", re: /salary|compensation|remuneration|\bCTC\b|wages|stipend/i },
  { kind: "fee", re: /\brent\b|\bfees?\b|charges?|subscription|royalt|price|payment|licen[cs]e/i },
];

function categorizeMoney(text: string): Map<MoneyKind, MoneyAmount> {
  const found = new Map<MoneyKind, MoneyAmount>();
  for (const m of extractMoneyAmounts(text)) {
    const windowText = text.slice(Math.max(0, m.index - 80), m.index + m.raw.length + 60);
    let kind: MoneyKind = "other";
    for (const h of MONEY_KIND_HINTS) {
      if (h.re.test(windowText)) {
        kind = h.kind;
        break;
      }
    }
    if (!found.has(kind)) found.set(kind, m);
  }
  return found;
}

function directionOf(prev: number, curr: number): Direction {
  return curr > prev ? "increase" : curr < prev ? "decrease" : "neutral";
}

function moneyParameterName(kind: MoneyKind): { parameter: string; label: string } {
  switch (kind) {
    case "reimbursement":
    case "penalty":
      return { parameter: "Financial Obligation / Reimbursement", label: "Financial Obligation" };
    case "deposit":
      return { parameter: "Deposit Amount", label: "Deposit" };
    case "salary":
      return { parameter: "Compensation Amount", label: "Compensation" };
    case "fee":
      return { parameter: "Payment Amount", label: "Payment Amount" };
    default:
      return { parameter: "Stated Amount", label: "Stated Amount" };
  }
}

interface ExtractedParameters {
  semanticDetails: SemanticDiffDetail[];
  impacts: { category: ImpactCategory; label: string; description: string }[];
  highlightNotes: string[];
}

const has = (text: string, re: RegExp) => re.test(text);

/** Detects specialized semantic differences between two clauses */
function extractSemanticParameters(prevClause: Clause, currClause: Clause, ctx: CompareContext): ExtractedParameters {
  const details: SemanticDiffDetail[] = [];
  const impacts: ExtractedParameters["impacts"] = [];
  const highlightNotes: string[] = [];

  const prevText = prevClause.rawText;
  const currText = currClause.rawText;
  const prevLower = prevText.toLowerCase();
  const currLower = currText.toLowerCase();

  // 1. Durations: compared like-with-like (same kind of period), in the document's own units.
  const prevDurations = categorizeDurations(prevText);
  const currDurations = categorizeDurations(currText);
  for (const spec of DURATION_KINDS) {
    const pd = prevDurations.get(spec.kind);
    const cd = currDurations.get(spec.kind);
    if (!pd || !cd || pd.approxDays === cd.approxDays) continue;
    const dir = directionOf(pd.approxDays, cd.approxDays);
    const change = describeDurationChange(pd, cd);
    const value = (d: Duration) => formatDuration(d);
    details.push({
      parameter: spec.parameter,
      previousValue: value(pd),
      currentValue: value(cd),
      changeSummary: `${change} (${value(pd)} → ${value(cd)})`,
      impactCategory: spec.impact,
      direction: dir,
    });
    impacts.push({
      category: spec.impact,
      label: spec.label,
      description: `${spec.parameter} ${dir === "increase" ? "lengthened" : "shortened"} from ${value(pd)} to ${value(cd)} (${change}).`,
    });
    highlightNotes.push(`${spec.parameter} ${dir === "increase" ? "increased" : "decreased"} from ${value(pd)} to ${value(cd)}.`);
  }

  // 2. Money: same currency and same kind of amount only; a currency change is reported, not subtracted.
  const prevMoney = categorizeMoney(prevText);
  const currMoney = categorizeMoney(currText);
  for (const [kind, pm] of prevMoney) {
    const cm = currMoney.get(kind);
    if (!cm) continue;
    const names = moneyParameterName(kind);
    const sameCurrency = (pm.currency || cm.currency) === (cm.currency || pm.currency);
    if (sameCurrency && pm.amount === cm.amount) continue;
    if (!sameCurrency) {
      details.push({
        parameter: names.parameter,
        previousValue: pm.raw,
        currentValue: cm.raw,
        changeSummary: `Currency changed (${pm.raw} → ${cm.raw}); amounts are not directly comparable`,
        impactCategory: "financial",
        direction: "neutral",
      });
      continue;
    }
    const dir = directionOf(pm.amount, cm.amount);
    const currency = cm.currency || pm.currency;
    const change = describeMoneyChange(pm, cm);
    const prevDisplay = formatMoney(currency, pm.amount);
    const currDisplay = formatMoney(currency, cm.amount);
    details.push({
      parameter: names.parameter,
      previousValue: prevDisplay,
      currentValue: currDisplay,
      changeSummary: `${change} (${prevDisplay} → ${currDisplay})`,
      impactCategory: "financial",
      direction: dir,
    });
    impacts.push({
      category: "financial",
      label: names.label,
      description: `Stated amount ${dir === "increase" ? "increased" : "decreased"} from ${prevDisplay} to ${currDisplay} (${change}).`,
    });
    highlightNotes.push(`${names.label} ${dir === "increase" ? "increased" : "decreased"} by ${formatMoney(currency, Math.abs(cm.amount - pm.amount))}.`);
  }

  // 3. Restrictive covenants: geographic scope in either direction
  const isRestrictive =
    prevClause.category === "restriction" || currClause.category === "restriction" ||
    has(currLower, /non-?compet|competing|non-?solicit/) || has(prevLower, /non-?compet|competing|non-?solicit/);
  if (isRestrictive) {
    const radius = (t: string) => {
      const m = t.match(/(\d{1,4})\s*(?:\(\d+\)\s*)?[- ]?(mile|miles|km|kilomet(?:er|re)s?)\b/i);
      return m ? { value: parseInt(m[1], 10), unit: /mile/i.test(m[2]) ? "mile" : "km" } : null;
    };
    const pr = radius(prevText);
    const cr = radius(currText);
    if (pr && cr && pr.unit === cr.unit && pr.value !== cr.value) {
      const dir = directionOf(pr.value, cr.value);
      details.push({
        parameter: "Geographic Scope",
        previousValue: `${pr.value}-${pr.unit} radius`,
        currentValue: `${cr.value}-${cr.unit} radius`,
        changeSummary: `${dir === "increase" ? "Expanded" : "Narrowed"} radius (${pr.value} → ${cr.value} ${cr.unit}s)`,
        impactCategory: "scope",
        direction: dir,
      });
      impacts.push({ category: "scope", label: "Geographic Scope", description: `Restricted radius ${dir === "increase" ? "expanded" : "narrowed"} from ${pr.value} to ${cr.value} ${cr.unit}s.` });
    } else {
      const pp = resolvePlace(prevText);
      const cp = resolvePlace(currText);
      if (pp && cp) {
        const prevLabel = pp.stateOrUT || pp.country;
        const currLabel = cp.stateOrUT || cp.country;
        if (prevLabel !== currLabel) {
          const expanded = pp.country === cp.country && pp.stateOrUT && !cp.stateOrUT;
          const narrowed = pp.country === cp.country && !pp.stateOrUT && cp.stateOrUT;
          const dir: Direction = expanded ? "increase" : narrowed ? "decrease" : "neutral";
          details.push({
            parameter: "Geographic Scope",
            previousValue: expanded ? `State of ${prevLabel}` : prevLabel,
            currentValue: expanded ? `Territory of ${currLabel} (Nationwide)` : currLabel,
            changeSummary: expanded
              ? `Expanded from regional (${prevLabel}) to all-${currLabel} nationwide restriction`
              : narrowed
              ? `Narrowed from nationwide (${prevLabel}) to ${currLabel}`
              : `Territory changed from ${prevLabel} to ${currLabel}`,
            impactCategory: "scope",
            direction: dir,
          });
          impacts.push({
            category: "scope",
            label: "Geographic Scope",
            description: `Restriction territory ${expanded ? "expanded" : narrowed ? "narrowed" : "changed"} from ${prevLabel} to ${currLabel}.`,
          });
        }
      }
    }
  }

  // 4. Intellectual property reach (outside working hours / personal equipment)
  const isIP =
    prevClause.category === "intellectual_property" || currClause.category === "intellectual_property" ||
    has(currLower, /inventions|patent/) || has(prevLower, /inventions|patent/);
  if (isIP) {
    const broadRe = /whether or not during regular working hours|outside (?:of )?(?:regular |normal )?(?:working|business) hours|personal (?:time|equipment|hardware|devices?)|whether or not (?:utili[sz]ing|using) company/;
    const prevBroad = has(prevLower, broadRe);
    const currBroad = has(currLower, broadRe);
    if (prevBroad !== currBroad) {
      const dir: Direction = currBroad ? "increase" : "decrease";
      details.push({
        parameter: "IP Assignment Scope",
        previousValue: prevBroad ? "Includes personal time and devices" : "Work hours & company facilities",
        currentValue: currBroad ? "24/7 all times, including personal hardware outside work hours" : "Work hours & company facilities",
        changeSummary: currBroad
          ? "Scope broadened to capture software and inventions created on personal time and devices"
          : "Scope narrowed to work done during working hours or with company resources",
        impactCategory: "scope",
        direction: dir,
      });
      impacts.push({
        category: "scope",
        label: "Ownership Reach",
        description: currBroad
          ? "Expanded assignment to include work conceived outside regular hours and on personal equipment."
          : "Assignment narrowed to exclude work conceived outside regular hours and on personal equipment.",
      });
      if (ctx.isIndian && currBroad) {
        impacts.push({
          category: "legal",
          label: "Statutory Boundary",
          description: "May exceed customary 'course of employment' inventions copyright protection under Indian law.",
        });
      }
    }
  }

  // 5. Dispute resolution: who appoints the arbitrator
  const isArbitration = prevClause.category === "dispute_resolution" || currClause.category === "dispute_resolution" || has(currLower, /arbitrat/);
  if (isArbitration) {
    const unilateralRe = /appointed exclusively by|sole discretion of the company|managing director|appointed by the (?:company|employer|landlord|licensor|provider)/;
    const mutualRe = /\bmutual(?:ly)?\b|agreed by both|both parties (?:shall )?(?:agree|appoint)|jointly appoint/;
    const prevUnilateral = has(prevLower, unilateralRe);
    const currUnilateral = has(currLower, unilateralRe);
    if (currUnilateral && !prevUnilateral) {
      details.push({
        parameter: "Arbitrator Appointment Mechanism",
        previousValue: has(prevLower, mutualRe) ? "Mutually agreed by both parties" : "Standard appointment",
        currentValue: ctx.documentType === "employment_agreement" || /managing director/.test(currLower) ? "Unilateral appointment by Company Managing Director" : "Unilateral appointment by one party",
        changeSummary: "Shifted from bilateral agreement to unilateral appointment of the sole arbitrator by one party",
        impactCategory: "legal",
        direction: "increase",
      });
      impacts.push({ category: "legal", label: "Dispute Resolution Neutrality", description: "Sole arbitrator appointment transferred to the unilateral control of one party." });
    } else if (prevUnilateral && !currUnilateral) {
      details.push({
        parameter: "Arbitrator Appointment Mechanism",
        previousValue: "Unilateral appointment by one party",
        currentValue: has(currLower, mutualRe) ? "Mutually agreed by both parties" : "Neutral or institutional appointment",
        changeSummary: "Shifted from unilateral appointment to a mutual or neutral appointment mechanism",
        impactCategory: "legal",
        direction: "decrease",
      });
      impacts.push({ category: "legal", label: "Dispute Resolution Neutrality", description: "Arbitrator appointment moved away from one party's unilateral control." });
    }
  }

  // 6. Termination / pay deduction discretion, in either direction
  const isTermination = ["termination", "notice"].includes(prevClause.category) || ["termination", "notice"].includes(currClause.category);
  if (isTermination) {
    const dedRe = /deduct|full and final settlement/;
    const prevDeduction = has(prevLower, dedRe);
    const currDeduction = has(currLower, dedRe);
    if (currDeduction !== prevDeduction) {
      details.push({
        parameter: "Settlement Deduction Remedy",
        previousValue: prevDeduction ? "Right to deduct from final settlement" : "Standard departure terms",
        currentValue: currDeduction ? "Right to deduct notice pay from full & final settlement" : "Standard departure terms",
        changeSummary: currDeduction
          ? "Right added to deduct unserved notice pay directly from terminal settlement dues"
          : "Right to deduct notice pay from terminal settlement dues removed",
        impactCategory: "operational",
        direction: currDeduction ? "increase" : "decrease",
      });
      impacts.push({
        category: "operational",
        label: "Payroll Settlement",
        description: currDeduction
          ? "Direct contractual authorization to withhold unserved notice amounts from final pay."
          : "The authorization to withhold unserved notice amounts from final pay was removed.",
      });
    }
  }

  return { semanticDetails: details, impacts, highlightNotes };
}

/** Determines change significance and structured explanations */
function assessChangeSignificance(
  changeType: ChangeType,
  category: ClauseCategory,
  details: SemanticDiffDetail[],
  prevText: string,
  currText: string,
  isSectionMoved: boolean
): { significance: ChangeSignificance; explanation: string } {
  if (changeType === "UNCHANGED") {
    return {
      significance: "INFORMATIONAL",
      explanation: isSectionMoved
        ? "Clause text is identical; only the section numbering was adjusted."
        : "Clause text is identical between both drafts.",
    };
  }

  if (changeType === "MOVED") {
    return {
      significance: "INFORMATIONAL",
      explanation: "Clause was renumbered to a different section without substantive wording changes.",
    };
  }

  if (changeType === "MODIFIED") {
    if (stripPunctuation(prevText) === stripPunctuation(currText)) {
      return {
        significance: "INFORMATIONAL",
        explanation: "Formatting, punctuation, or capitalization adjustments with no material legal impact.",
      };
    }
  }

  const hasHighParameter = details.some(
    (d) =>
      d.parameter.includes("Financial") ||
      d.parameter.includes("Notice Period") ||
      d.parameter.includes("Restriction") ||
      d.parameter.includes("Geographic") ||
      d.parameter.includes("Arbitrator") ||
      d.parameter.includes("IP Assignment") ||
      d.parameter.includes("Amount") ||
      d.parameter.includes("Deduction")
  );

  if (hasHighParameter) {
    return {
      significance: "HIGH",
      explanation: "Materially alters substantive rights, financial liabilities, exit timelines, or dispute resolution mechanisms.",
    };
  }

  if (
    category === "payment" ||
    category === "restriction" ||
    category === "liability" ||
    category === "indemnity" ||
    category === "dispute_resolution"
  ) {
    return {
      significance: "HIGH",
      explanation: "Substantive changes affecting commercial exposure, operational restrictions, or dispute terms.",
    };
  }

  if (category === "termination" || category === "notice" || category === "intellectual_property") {
    return {
      significance: "MEDIUM",
      explanation: "Adjusts operational timelines, termination conditions, or proprietary rights allocation.",
    };
  }

  if (details.length > 0) {
    return {
      significance: "MEDIUM",
      explanation: "A measurable term (period, amount or scope) changed between the drafts.",
    };
  }

  if (category === "confidentiality" || category === "jurisdiction" || category === "employment") {
    return {
      significance: "LOW",
      explanation: "Minor substantive revisions to administrative terms or customary representations.",
    };
  }

  return {
    significance: "LOW",
    explanation: "Substantive adjustment with limited legal exposure or operational impact.",
  };
}

// ────────────────────────────────────────────────────────────────────────────
// Narrative (direction-aware, party-neutral unless employment)
// ────────────────────────────────────────────────────────────────────────────

interface Narrative {
  whyItMatters: string;
  whatToVerify: string[];
  whatToAsk: string;
  suggestedActionTitle: string;
  suggestedActionExplanation: string;
  suggestedAskQuestion: string;
}

type Topic = "training" | "notice" | "restraint" | "ip" | "arbitration" | "payment" | "generic";

function resolveTopic(title: string, category: ClauseCategory, prevText: string, currText: string): Topic {
  const t = title.toLowerCase();
  const text = `${prevText} ${currText}`.toLowerCase();
  if ((/training|bond|clawback|reimburs/.test(t) || /training|clawback/.test(text)) && (category === "payment" || category === "termination" || /reimburs|repay/.test(text))) return "training";
  if (/notice/.test(t) || category === "notice") return "notice";
  if (/non-?compet|restrictive|solicit/.test(t) || category === "restriction") return "restraint";
  if (/intellectual|invention/.test(t) || category === "intellectual_property") return "ip";
  if (/arbitrat|dispute/.test(t) || category === "dispute_resolution") return "arbitration";
  if (category === "payment") return "payment";
  return "generic";
}

/** Dominant direction of the measurable changes, so prose never claims "increased" for a decrease. */
function dominantDirection(details: SemanticDiffDetail[], topic: Topic): Direction {
  const relevant = details.filter((d) => {
    if (topic === "training" || topic === "payment") return d.impactCategory === "financial";
    if (topic === "notice") return d.parameter === "Notice Period";
    if (topic === "restraint") return d.parameter === "Restriction Duration" || d.parameter === "Geographic Scope";
    if (topic === "ip") return d.parameter === "IP Assignment Scope";
    if (topic === "arbitration") return d.parameter.startsWith("Arbitrator");
    return true;
  });
  const dirs = new Set((relevant.length ? relevant : details).map((d) => d.direction).filter((d): d is Direction => Boolean(d) && d !== "neutral"));
  if (dirs.size === 1) return Array.from(dirs)[0];
  return "neutral";
}

function buildNarrative(
  title: string,
  category: ClauseCategory,
  details: SemanticDiffDetail[],
  changeType: ChangeType,
  prevClause: Clause | null,
  currClause: Clause | null,
  ctx: CompareContext
): Narrative {
  const employment = ctx.documentType === "employment_agreement";
  const party = employment ? "employee" : "party bound by this clause";
  const counterparty = employment ? "HR" : "the other party";
  const topic = resolveTopic(title, category, prevClause?.rawText || "", currClause?.rawText || "");
  const dir = dominantDirection(details, topic);
  const summaryOf = (predicate: (d: SemanticDiffDetail) => boolean, fallback: string) =>
    details.find(predicate)?.changeSummary ?? fallback;

  // Added / removed clauses (no measurable pair) are described as such.
  if (changeType === "ADDED") {
    return {
      whyItMatters: `A new clause has been introduced that did not exist in the previous baseline. It adds obligations, rights or conditions that were not part of the earlier draft.`,
      whatToVerify: [
        "What new obligations, restrictions or costs the clause creates, and for whom",
        "Whether any other document, policy or schedule it refers to has been provided",
        "Whether the clause interacts with existing termination, payment or liability terms",
      ],
      whatToAsk: `Could ${counterparty === "HR" ? "HR" : "you"} explain why this new clause was added and provide any documents it refers to?`,
      suggestedActionTitle: `Review new ${title} clause`,
      suggestedActionExplanation: "Review the new clause and verify whether any supplemental documents must be provided before agreeing.",
      suggestedAskQuestion: `What obligations does the newly added ${title} clause introduce for the ${party}?`,
    };
  }
  if (changeType === "REMOVED") {
    return {
      whyItMatters: `This term was present in the previous draft but is missing from the revised version. A deletion can remove a protection, limit or procedural safeguard that one side was relying on.`,
      whatToVerify: [
        "Whether the omission was intentional or an accidental drafting omission",
        "Whether the subject is now covered elsewhere in the agreement or by other policies or law",
        "What recourse remains if the situation this clause addressed arises",
      ],
      whatToAsk: `Was the removal of ${title} intentional, and is this subject addressed elsewhere?`,
      suggestedActionTitle: `Clarify reasons for omission of ${title} clause`,
      suggestedActionExplanation: "Ask the drafting party to confirm whether the deletion was intentional and what now governs this topic.",
      suggestedAskQuestion: `Why was ${title} removed from the revised draft, and what does this mean for the ${party}?`,
    };
  }

  const up = dir === "increase";
  const down = dir === "decrease";

  switch (topic) {
    case "training": {
      const summary = summaryOf((d) => d.impactCategory === "financial", "changed amount");
      const change = up ? "is higher" : down ? "is lower" : "has changed";
      return {
        whyItMatters: `${
          ctx.isIndian && employment
            ? `The employee's potential contractual financial exposure ${change} (${summary}). In Indian employment contracts, liquidated damages clauses are enforceable only to the extent of actual expenses incurred by the employer, not as arbitrary penalties.`
            : `The potential financial exposure under this clause ${change} (${summary}). Whether a fixed repayment or liquidated-damages figure like this is enforceable, and whether it must be tied to actual costs, depends on the law that governs this agreement.`
        }`,
        whatToVerify: [
          "Itemized actual costs incurred for any training or benefit being recovered",
          "Whether the amount reduces pro-rata over the commitment period",
          "Whether departure for medical reasons or involuntary termination triggers repayment",
          "Contractual authorization enabling direct deduction from accrued final dues",
        ],
        whatToAsk: "Can you provide the itemized documentation of actual costs and confirm whether an amortization schedule applies?",
        suggestedActionTitle: down ? "Confirm the reduced repayment amount and how it is calculated" : "Clarify revised repayment amount and request amortization schedule",
        suggestedActionExplanation: "Request written confirmation of itemized costs and ask whether the amount reduces proportionally over time rather than as a lump-sum cliff.",
        suggestedAskQuestion: ctx.isIndian
          ? "What changed in the training reimbursement clause, and what should I verify regarding actual expenses under Indian law?"
          : "What changed in the training reimbursement clause, and what should I verify regarding actual expenses under the governing law of this agreement?",
      };
    }
    case "payment": {
      const summary = summaryOf((d) => d.impactCategory === "financial", "changed payment terms");
      return {
        whyItMatters: `A stated payment amount or payment term ${up ? "increased" : down ? "decreased" : "changed"} (${summary}). This directly changes what is owed, and when.`,
        whatToVerify: [
          "The exact amount, currency and due date in the revised clause",
          "Whether the change applies to past periods or only from a stated date",
          "Any late-payment charge, interest or escalation that accompanies the new figure",
        ],
        whatToAsk: "Can you confirm the effective date of the revised amount and whether any other charges change with it?",
        suggestedActionTitle: "Confirm the revised payment terms in writing",
        suggestedActionExplanation: "Ask the other party to confirm the revised amount, currency, due date and start date in writing.",
        suggestedAskQuestion: `What changed in the payment terms of ${title}, and what should I verify?`,
      };
    }
    case "notice": {
      const summary = summaryOf((d) => d.parameter === "Notice Period", "adjusted notice window");
      return {
        whyItMatters: up
          ? `A longer notice obligation (${summary}) reduces flexibility to exit or change arrangements and increases the cost of missing the window.`
          : down
          ? `A shorter notice obligation (${summary}) makes it quicker to end or change the arrangement, which helps whoever wants flexibility and reduces certainty for the other side.`
          : `The notice terms changed (${summary}), which affects how quickly and on what conditions either side can act.`,
        whatToVerify: [
          "Whether notice can be waived, shortened or paid in lieu, and by whom",
          "Whether the notice requirement applies equally to both parties",
          "How unserved notice interacts with any payment due at the end",
        ],
        whatToAsk: "Can we confirm whether notice can be shortened or bought out by mutual agreement?",
        suggestedActionTitle: "Verify notice period and early-release terms",
        suggestedActionExplanation: "Confirm whether the revised notice period can be shortened by mutual agreement and whether it applies to both parties.",
        suggestedAskQuestion: `What are the practical and legal implications of the notice period change (${summary})?`,
      };
    }
    case "restraint": {
      const summary = summaryOf((d) => d.parameter === "Restriction Duration" || d.parameter === "Geographic Scope", "changed restriction");
      const scopeWord = up ? "broadened in duration and/or geographic reach" : down ? "narrowed in duration and/or geographic reach" : "changed";
      const employmentRestraint = employment;
      return {
        whyItMatters: `${
          ctx.isIndian && employmentRestraint
            ? `The post-employment restriction has been ${scopeWord} (${summary}). Under Section 27 of the Indian Contract Act, 1872, post-employment non-compete covenants are generally void as restraints of trade, regardless of reasonableness.`
            : `The restriction has been ${scopeWord} (${summary}). Whether a restraint like this is enforceable, and to what scope and duration, depends heavily on the law governing this agreement; some jurisdictions void such restraints outright, while others test them for reasonableness.`
        }`,
        whatToVerify: [
          "Scope of restricted activities and any named competing enterprises or clients",
          "Whether non-solicitation of clients is distinguished from a general bar on competing work",
          "Whether the restraint is enforceable at all under the governing law, and under what standard",
          "Whether any compensation is paid during the restricted period",
        ],
        whatToAsk: "Could we clarify the specific list of covered competitors or clients and narrow the restriction's geographic and time scope?",
        suggestedActionTitle: down ? "Confirm the narrowed restriction scope" : "Seek clarification on restriction scope and define specific competitors or clients",
        suggestedActionExplanation: "Request that the restriction be limited to a specific list of direct competitors or focused on non-solicitation of active clients.",
        suggestedAskQuestion: ctx.isIndian && employmentRestraint
          ? "Is the revised post-employment non-compete enforceable under Section 27 of the Indian Contract Act?"
          : "Is the revised restriction enforceable under the law governing this agreement?",
      };
    }
    case "ip": {
      return {
        whyItMatters: up
          ? `${
              ctx.isIndian && employment
                ? "The assignment reach has been expanded to encompass work created outside business hours and on personal hardware. Under Section 17(c) of the Copyright Act, 1957, employer ownership ordinarily attaches to works authored in the course of employment."
                : "The assignment reach has been expanded to encompass work created outside business hours or on personal equipment. Whether ownership extends that far depends on the governing law and any carve-outs in the agreement."
            }`
          : down
          ? "The assignment reach has been narrowed compared with the previous draft, leaving more work with its creator."
          : "The intellectual property terms changed; review who owns what under the revised wording.",
        whatToVerify: [
          "Carve-outs for pre-existing work, open-source contributions and personal side projects",
          "Requirement to disclose intellectual property developed independently",
          "Whether moral-rights waivers are drafted reasonably under applicable law",
          "A clear line between the other party's assets and independent work",
        ],
        whatToAsk: "Can we attach a schedule listing pre-existing work and clarify that unrelated independent work is excluded?",
        suggestedActionTitle: "Document and carve out pre-existing work from the IP assignment",
        suggestedActionExplanation: "Prepare a schedule of prior work and repositories to explicitly exclude from the assignment.",
        suggestedAskQuestion: "Does the revised IP assignment clause overreach regarding work created outside the other party's business?",
      };
    }
    case "arbitration": {
      const toUnilateral = details.some((d) => d.parameter.startsWith("Arbitrator") && d.direction === "increase");
      const toMutual = details.some((d) => d.parameter.startsWith("Arbitrator") && d.direction === "decrease");
      return {
        whyItMatters: toUnilateral
          ? ctx.isIndian
            ? "The dispute resolution mechanism has shifted from mutual agreement to unilateral appointment by one party. Indian Supreme Court precedent (e.g. Perkins Eastman) has established that an interested party cannot unilaterally appoint a sole arbitrator."
            : "The dispute resolution mechanism has shifted from mutual agreement to unilateral appointment by one party. Whether an interested party may unilaterally appoint a sole arbitrator depends on the arbitration law and rules governing this agreement."
          : toMutual
          ? "The arbitrator appointment mechanism has moved away from one party's unilateral control toward a more neutral process."
          : "The dispute resolution terms changed; review the forum, seat, appointment and cost allocation in the revised clause.",
        whatToVerify: [
          "Whether arbitrator appointment requires mutual consensus between both parties",
          "Whether an interested party may unilaterally appoint the arbitrator under the governing arbitration law",
          "Arbitration seat and administrative venue designations",
          "Cost-sharing provisions for arbitrator fees and institutional charges",
        ],
        whatToAsk: "Could this clause provide for arbitrator appointment by mutual consent or through a recognized arbitral institution?",
        suggestedActionTitle: toMutual ? "Confirm the revised arbitrator appointment mechanism" : "Request a mutual appointment mechanism for the sole arbitrator",
        suggestedActionExplanation: "Propose standard bilateral appointment language or institutional arbitration in place of unilateral appointment.",
        suggestedAskQuestion: ctx.isIndian
          ? "Is unilateral appointment of a sole arbitrator by one party permissible under Indian arbitration law?"
          : "Is unilateral appointment of a sole arbitrator by one party permissible under the arbitration law governing this agreement?",
      };
    }
    default: {
      const summary = details.length > 0 ? details.map((d) => d.changeSummary).join("; ") : "";
      return {
        whyItMatters: summary
          ? `This revision changes: ${summary}. Review whether the new terms match what you expected and what was discussed.`
          : "This revision introduces contractual wording changes that warrant review to ensure alignment with original expectations.",
        whatToVerify: [
          "Exact operative terms and definitions in the revised clause",
          "Interplay with other sections of the agreement",
          "Whether the change creates asymmetric discretion or operational burdens",
        ],
        whatToAsk: `Could you clarify the background and intent behind the updated wording in ${title}?`,
        suggestedActionTitle: `Review revised terms in ${title}`,
        suggestedActionExplanation: "Review the updated text and ask for written clarification if any terms are ambiguous.",
        suggestedAskQuestion: `What changed in ${title}, and what should I verify?`,
      };
    }
  }
}

/** Analyzes differences for a matched pair and generates a complete ClauseComparisonItem */
export function analyzeClauseDifference(
  pair: MatchedClausePair,
  index: number,
  context: boolean | CompareContext = true
): ClauseComparisonItem {
  const ctx = toContext(context);
  const { previousClause, currentClause, previousSection, currentSection, isSectionMoved } = pair;

  let changeType: ChangeType = "MODIFIED";
  let clauseTitle = "Contract Clause";
  let category: ClauseCategory = "general";

  let originalText = "";
  let revisedText = "";

  if (previousClause && !currentClause) {
    changeType = "REMOVED";
    clauseTitle = previousClause.title;
    category = previousClause.category;
    originalText = previousClause.rawText;
    revisedText = "[Clause removed in current version]";
  } else if (!previousClause && currentClause) {
    changeType = "ADDED";
    clauseTitle = currentClause.title;
    category = currentClause.category;
    originalText = "[Clause not present in previous version]";
    revisedText = currentClause.rawText;
  } else if (previousClause && currentClause) {
    clauseTitle = currentClause.title || previousClause.title;
    category = currentClause.category || previousClause.category;
    originalText = previousClause.rawText;
    revisedText = currentClause.rawText;

    const normA = normalizeTextForComparison(originalText);
    const normB = normalizeTextForComparison(revisedText);

    if (normA === normB) {
      changeType = isSectionMoved ? "MOVED" : "UNCHANGED";
    } else {
      changeType = "MODIFIED";
    }
  }

  const { semanticDetails, impacts } =
    previousClause && currentClause
      ? extractSemanticParameters(previousClause, currentClause, ctx)
      : { semanticDetails: [] as SemanticDiffDetail[], impacts: [] as ExtractedParameters["impacts"] };

  const { significance, explanation: significanceExplanation } = assessChangeSignificance(
    changeType,
    category,
    semanticDetails,
    originalText,
    revisedText,
    isSectionMoved
  );

  const {
    whyItMatters,
    whatToVerify,
    whatToAsk,
    suggestedActionTitle,
    suggestedActionExplanation,
    suggestedAskQuestion,
  } = buildNarrative(clauseTitle, category, semanticDetails, changeType, previousClause, currentClause, ctx);

  let summary = "";
  if (changeType === "ADDED") {
    summary = `New clause added to the contract (${currentSection || "New Section"}).`;
  } else if (changeType === "REMOVED") {
    summary = `Clause removed from the contract (${previousSection || "Previous Section"}).`;
  } else if (changeType === "UNCHANGED") {
    summary = isSectionMoved
      ? `Renumbered from ${previousSection} to ${currentSection}; content unchanged.`
      : `Terms identical to previous version.`;
  } else if (changeType === "MOVED") {
    summary = `Renumbered from ${previousSection} to ${currentSection} without text changes.`;
  } else {
    if (semanticDetails.length > 0) {
      summary = semanticDetails.map((d: SemanticDiffDetail) => d.changeSummary).join("; ");
      if (isSectionMoved) {
        summary = `Renumbered (${previousSection} → ${currentSection}) and modified: ${summary}`;
      }
    } else {
      summary = isSectionMoved
        ? `Renumbered from ${previousSection} to ${currentSection} with wording adjustments.`
        : `Updated contractual wording and obligations.`;
    }
  }

  const changeSlug = (clauseTitle || "clause")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  const suggestedActionItem: ActionPlanItem = {
    id: `action-compare-${index}-${changeSlug || "clause"}`,
    title: suggestedActionTitle,
    explanation: suggestedActionExplanation,
    actionType: "clarify",
    priority: significance === "HIGH" ? "urgent" : significance === "MEDIUM" ? "important" : "recommended",
    clauseSection: currentSection || previousSection || "Section",
    isReversible: true,
    completed: false,
    practicalAdvice: whatToAsk,
  };

  return {
    id: `change-${index}-${(clauseTitle || "clause").toLowerCase().replace(/[^a-z0-9]/g, "-")}`,
    clauseTitle,
    category,
    previousClause,
    currentClause,
    previousSection,
    currentSection,
    changeType,
    significance,
    significanceExplanation,
    summary,
    whatChanged: {
      original: originalText,
      revised: revisedText,
    },
    whyItMatters,
    whatToVerify,
    whatToAsk,
    impacts,
    suggestedActionItem,
    suggestedAskQuestion,
    semanticDetails: semanticDetails.length > 0 ? semanticDetails : undefined,
  };
}

/** Analyzes all matched pairs and generates a prioritized comparison list */
export function analyzeAllClauseDifferences(
  pairs: MatchedClausePair[],
  context: boolean | CompareContext = true
): ClauseComparisonItem[] {
  return pairs.map((pair, idx) => analyzeClauseDifference(pair, idx, context));
}
