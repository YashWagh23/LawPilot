import type { AnalysisReport } from "@/types";

export interface SuggestedQuestion {
  id: string;
  question: string;
  category: "fact" | "risk" | "legal" | "action";
  highlightClauseSection?: string;
}

/**
 * Generates dynamically relevant suggested question chips based on the active report
 */
export function getSuggestedQuestions(report: AnalysisReport): SuggestedQuestion[] {
  // Flagship India Employment Agreement Preset
  const isEmployment =
    report.metadata.documentType === "employment_agreement" ||
    report.metadata.title.toLowerCase().includes("employment") ||
    report.id === "demo-employment-agreement";

  if (isEmployment) {
    return [
      {
        id: "sq-notice",
        question: "What's my notice period?",
        category: "fact",
        highlightClauseSection: "4",
      },
      {
        id: "sq-important",
        question: "What clauses are most important?",
        category: "risk",
      },
      {
        id: "sq-non-compete",
        question: "Why is the non-compete flagged?",
        category: "legal",
        highlightClauseSection: "5",
      },
      {
        id: "sq-training-bond",
        question: "Can my employer recover the training amount?",
        category: "legal",
        highlightClauseSection: "8",
      },
      {
        id: "sq-hr",
        question: "What should I ask HR?",
        category: "action",
      },
      {
        id: "sq-lawyer",
        question: "What should I show a lawyer?",
        category: "action",
      },
    ];
  }

  // Dynamic suggestions for other contracts (e.g. leases, commercial contracts, vendor agreements)
  const suggestions: SuggestedQuestion[] = [];

  // Look for notice period / termination
  const noticeDate = (report.keyDates || []).find((d) => d.noticePeriodDays);
  if (noticeDate) {
    suggestions.push({
      id: "sq-dyn-notice",
      question: "What is the notice period for termination?",
      category: "fact",
      highlightClauseSection: noticeDate.clauseReference?.section,
    });
  } else {
    suggestions.push({
      id: "sq-dyn-important",
      question: "What are the most critical terms in this agreement?",
      category: "risk",
    });
  }

  // Check critical or high findings
  const criticalFindings = report.findings.filter(
    (f) => f.severity === "critical_attention" || f.severity === "high_attention"
  );

  if (criticalFindings.length > 0) {
    const topFinding = criticalFindings[0];
    suggestions.push({
      id: `sq-dyn-risk-${topFinding.id}`,
      question: `Why is "${topFinding.title}" considered a risk?`,
      category: "risk",
      highlightClauseSection: topFinding.evidence?.section || topFinding.clauseReference?.section,
    });
  }

  // Check financial clawbacks or deposits
  const fin = (report.financialTerms || [])[0];
  if (fin) {
    suggestions.push({
      id: "sq-dyn-fin",
      question: `What are my payment obligations for ${fin.label}?`,
      category: "fact",
    });
  }

  suggestions.push({
    id: "sq-dyn-missing",
    question: "What facts or information are missing from this document?",
    category: "risk",
  });

  suggestions.push({
    id: "sq-dyn-action-hr",
    question: "What questions should I clarify before signing?",
    category: "action",
  });

  suggestions.push({
    id: "sq-dyn-lawyer-brief",
    question: "What issues should I show to a lawyer for formal review?",
    category: "action",
  });

  return suggestions.slice(0, 6);
}
