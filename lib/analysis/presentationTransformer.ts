import type {
  AnalysisReport,
  Finding,
  EvidenceChain,
  Clause,
  ActionPlan,
  ActionPlanItem,
  DocumentComparisonResult,
} from "@/types";

export interface FindingPresentation {
  id: string;
  clauseId: string;
  severityLabel: "HIGH" | "MEDIUM" | "REVIEW" | "INFO";
  severityColor: "rose" | "amber" | "blue" | "slate";
  title: string;
  keyValue?: string;
  summary: string;
  clauseReference: string;
  pageNumber?: number | null;
  section: string;
  // Layer 2: Supporting Details
  whyWeFlagged: string;
  whatContractSays: string;
  whyItMayMatter: string;
  whatToVerify: string[];
  whatToDoNext: string[];
  // Layer 3 references
  evidenceChain?: EvidenceChain;
  rawClause?: Clause;
}

export interface SimpleActionItem {
  id: string;
  number: number;
  title: string;
  whyRecommended: string;
  practicalAdvice?: string;
  clauseReference?: string;
  findingTitle?: string;
  priority: "urgent" | "important" | "recommended";
  isFromCompare?: boolean;
}

export interface TopChangeHighlight {
  id: string;
  label: string;
  deltaText: string;
  category: string;
  clauseTitle: string;
  severity: "high" | "medium" | "low";
}

/**
 * Humanizes finding severity to simplified 3-level tier
 */
export function humanizeSeverity(severity: string): {
  label: "HIGH" | "MEDIUM" | "REVIEW" | "INFO";
  color: "rose" | "amber" | "blue" | "slate";
} {
  switch (severity) {
    case "critical_attention":
    case "high_attention":
    case "critical":
    case "high":
      return { label: "HIGH", color: "rose" };
    case "review":
    case "medium":
      return { label: "MEDIUM", color: "amber" };
    case "context_dependent":
      return { label: "REVIEW", color: "blue" };
    default:
      return { label: "INFO", color: "slate" };
  }
}

/**
 * Extracts standout quantitative numbers (e.g. ₹4,50,000, 12 months, 90 days)
 * from finding text, financial terms, or key dates.
 */
export function extractStandoutValue(finding: Finding, report: AnalysisReport): string | undefined {
  const textToScan = `${finding.title} ${finding.description} ${finding.evidence?.quotedText || ""}`;

  // 1. Match Indian Rupee or standard currency amounts
  const rupeeMatch = textToScan.match(/(?:₹|Rs\.?|INR)\s*[\d,]+(?:\.\d+)?(?:\s*(?:Lakh|Crore|L|Cr))?/i);
  if (rupeeMatch) {
    return rupeeMatch[0].replace(/\s+/g, " ").trim();
  }

  // 2. Cross-reference financial terms associated with this clause
  if (report.financialTerms && report.financialTerms.length > 0) {
    const matchedFin = report.financialTerms.find(
      (f) =>
        f.label.toLowerCase().includes(finding.title.toLowerCase().slice(0, 10)) ||
        textToScan.toLowerCase().includes(f.formattedAmount.toLowerCase())
    );
    if (matchedFin) return matchedFin.formattedAmount;
  }

  // 3. Time duration / restriction windows (e.g. 12 months, 2 years)
  const durationMatch = textToScan.match(/\b(\d+)\s*(months?|years?|days?)\b/i);
  if (durationMatch) {
    const isScope = textToScan.toLowerCase().includes("all-india") || textToScan.toLowerCase().includes("india");
    return isScope ? `${durationMatch[0]} · All-India` : durationMatch[0];
  }

  // 4. Notice period days
  const noticeMatch = textToScan.match(/\b(\d+)\s*days?\s*notice\b/i);
  if (noticeMatch) {
    return `${noticeMatch[1]} days notice`;
  }

  // 5. Check key dates
  if (report.keyDates) {
    const matchedDate = report.keyDates.find(
      (d) => d.noticePeriodDays && textToScan.toLowerCase().includes("notice")
    );
    if (matchedDate?.noticePeriodDays) {
      return `${matchedDate.noticePeriodDays} days notice`;
    }
  }

  return undefined;
}

/**
 * Transforms raw finding into a human, progressive presentation model
 */
export function toFindingPresentation(
  finding: Finding,
  report: AnalysisReport
): FindingPresentation {
  const { label, color } = humanizeSeverity(finding.severity);
  const keyValue = extractStandoutValue(finding, report);

  const matchedClause = report.clauses.find(
    (c) => c.id === finding.clauseId || c.id === finding.evidence?.clauseId
  );

  const matchedChain = report.evidenceChains.find(
    (chain) =>
      chain.finding.id === finding.id ||
      chain.finding.clauseId === finding.clauseId ||
      chain.id === finding.id
  );

  // Clean clause reference
  const section =
    finding.evidence?.section ||
    matchedClause?.section ||
    "Clause";
  const pageNumber =
    finding.evidence?.pageNumber ??
    matchedClause?.pageNumber ??
    null;
  const clauseReference = pageNumber
    ? `${section} · Page ${pageNumber}`
    : section;

  // Layer 1: One-sentence plain English summary
  let summary = finding.description || finding.summary || "";
  if (summary.includes(". ")) {
    summary = summary.split(". ")[0] + ".";
  }

  // Layer 2: Breakdown
  const whyWeFlagged =
    finding.whyItMatters ||
    matchedChain?.finding?.summary ||
    finding.description;

  const whatContractSays =
    finding.evidence?.quotedText ||
    matchedClause?.rawText?.slice(0, 240) ||
    "See full text in document viewer.";

  const whyItMayMatter =
    matchedChain?.legalClaims?.[0]?.statement ||
    finding.whyItMatters ||
    "May create an enforceable obligation or restriction upon exit.";

  // What to verify (1-3 items)
  const whatToVerify: string[] = [];
  if (finding.uncertainties && finding.uncertainties.length > 0) {
    whatToVerify.push(...finding.uncertainties.slice(0, 3));
  } else if (matchedChain?.uncertainties && matchedChain.uncertainties.length > 0) {
    whatToVerify.push(...matchedChain.uncertainties.slice(0, 3));
  } else if (matchedChain?.uncertainty?.factualDependencies?.length) {
    whatToVerify.push(...matchedChain.uncertainty.factualDependencies.slice(0, 3));
  } else {
    whatToVerify.push("Confirm whether actual expenses or proofs of cost are required.");
    whatToVerify.push("Review whether this clause is applied uniformly across roles.");
  }

  // What to do next (1-2 items)
  const whatToDoNext: string[] = [];
  if (matchedChain?.nextSteps && matchedChain.nextSteps.length > 0) {
    whatToDoNext.push(matchedChain.nextSteps[0].practicalAdvice || matchedChain.nextSteps[0].title);
  } else if (matchedChain?.practicalNextStep) {
    whatToDoNext.push(matchedChain.practicalNextStep.practicalAdvice || matchedChain.practicalNextStep.title);
  } else if (finding.actionableAdvice) {
    whatToDoNext.push(finding.actionableAdvice);
  } else {
    whatToDoNext.push("Request written clarification or cap the amount before signing.");
  }

  return {
    id: finding.id,
    clauseId: finding.clauseId || finding.evidence?.clauseId || "",
    severityLabel: label,
    severityColor: color,
    title: cleanFindingTitle(finding.title),
    keyValue,
    summary,
    clauseReference,
    pageNumber,
    section,
    whyWeFlagged,
    whatContractSays,
    whyItMayMatter,
    whatToVerify,
    whatToDoNext,
    evidenceChain: matchedChain,
    rawClause: matchedClause,
  };
}

/**
 * Removes internal technical jargon prefixes from finding titles
 */
export function cleanFindingTitle(title: string): string {
  return title
    .replace(/^Potential\s+/i, "")
    .replace(/^Financial Obligation Finding Detected:\s*/i, "")
    .replace(/^Finding:\s*/i, "")
    .replace(/^Risk:\s*/i, "")
    .trim();
}

/**
 * Simplifies action plan into a clean numbered list
 */
export function toSimpleActionPresentation(actionPlan: ActionPlan): SimpleActionItem[] {
  const candidateItems: ActionPlanItem[] = [
    ...(actionPlan.urgentItems || []),
    ...(actionPlan.beforeSigning || []),
    ...(actionPlan.questionsToAsk || []),
    ...(actionPlan.followUpItems || []),
  ];

  const seenIds = new Set<string>();
  const uniqueItems: ActionPlanItem[] = [];

  for (const item of candidateItems) {
    if (!item || !item.id) continue;
    if (!seenIds.has(item.id)) {
      seenIds.add(item.id);
      uniqueItems.push(item);
    }
  }

  // Take top 5-7 highest priority items
  return uniqueItems.slice(0, 6).map((item, idx) => ({
    id: item.id,
    number: idx + 1,
    title: item.title,
    whyRecommended: item.explanation,
    practicalAdvice: item.practicalAdvice,
    clauseReference: item.clauseSection,
    findingTitle: item.findingTitle,
    priority: item.priority === "urgent" ? "urgent" : item.priority === "important" ? "important" : "recommended",
  }));
}

/**
 * Distills top changes into high-impact parameter changes
 */
export function toTopChangeHighlights(
  comparison: DocumentComparisonResult
): TopChangeHighlight[] {
  const highlights: TopChangeHighlight[] = [];

  const changes = comparison.topMaterialChanges.length > 0
    ? comparison.topMaterialChanges
    : comparison.changes;

  for (const c of changes.slice(0, 4)) {
    let deltaText = "";
    const firstDetail = c.semanticDetails?.[0];
    if (firstDetail?.previousValue && firstDetail?.currentValue) {
      deltaText = `${firstDetail.previousValue} → ${firstDetail.currentValue}`;
    } else if (firstDetail?.changeSummary) {
      deltaText = firstDetail.changeSummary;
    } else if (c.changeType === "ADDED") {
      deltaText = "New clause added";
    } else if (c.changeType === "REMOVED") {
      deltaText = "Clause removed";
    } else {
      deltaText = "Modified terms";
    }

    const isHigh = c.significance === "HIGH" || (c.significance as string) === "critical" || (c.significance as string) === "high";
    const isMed = c.significance === "MEDIUM" || (c.significance as string) === "medium";

    highlights.push({
      id: c.id,
      label: c.clauseTitle,
      deltaText,
      category: c.category,
      clauseTitle: c.clauseTitle,
      severity: isHigh ? "high" : isMed ? "medium" : "low",
    });
  }

  return highlights;
}
