import type { AnalysisReport, Finding } from "@/types";
import { isEmploymentType } from "@/lib/documents/documentClassifier";

export interface SuggestedQuestion {
  id: string;
  question: string;
  category: "fact" | "risk" | "legal" | "action";
  highlightClauseSection?: string;
  /** Finding this question is about; sent with the question so the answer is about THAT clause. */
  findingId?: string;
  clauseId?: string;
}

function sectionOf(f: Finding): string | undefined {
  return f.evidence?.section || f.clauseReference?.section;
}

function shortTitle(f: Finding): string {
  return f.title.replace(/\s+deserves review$/i, "").replace(/\s*\(Section [^)]+\)$/i, "").trim();
}

/**
 * Generates suggested question chips from the ACTUAL findings of the active report, so every chip
 * points at a clause that exists in this document (never a hardcoded section number or an
 * employment-only topic for a lease or services agreement).
 */
export function getSuggestedQuestions(report: AnalysisReport): SuggestedQuestion[] {
  const employment = isEmploymentType(report.metadata.documentType);
  const findings = report.findings || [];
  const suggestions: SuggestedQuestion[] = [];
  const used = new Set<string>();

  const add = (q: SuggestedQuestion, f?: Finding) => {
    if (used.size >= 6 || used.has(q.id)) return;
    used.add(q.id);
    suggestions.push({ ...q, findingId: f?.id, clauseId: f?.clauseId, highlightClauseSection: q.highlightClauseSection ?? (f ? sectionOf(f) : undefined) });
  };

  const notice = findings.find((f) => /notice/i.test(f.category) || /\bnotice\b/i.test(f.title));
  if (notice) {
    add({ id: "sq-notice", question: employment ? "What's my notice period?" : "What is the notice period?", category: "fact" }, notice);
  } else {
    const noticeDate = (report.keyDates || []).find((d) => d.noticePeriodDays);
    if (noticeDate) add({ id: "sq-dyn-notice", question: "What is the notice period for termination?", category: "fact", highlightClauseSection: noticeDate.clauseReference?.section });
  }

  add({ id: "sq-important", question: "What clauses are most important?", category: "risk" });

  const restraint = findings.find((f) => /restrictive/i.test(f.category));
  if (restraint) {
    add(
      {
        id: `sq-restraint-${restraint.id}`,
        question: /non-?compete/i.test(restraint.title) ? "Why is the non-compete flagged?" : `Why is "${shortTitle(restraint)}" flagged?`,
        category: "legal",
      },
      restraint
    );
  }

  const training = findings.find((f) => /\btraining\b/i.test(f.title));
  if (employment && training) {
    add({ id: "sq-training-bond", question: "Can my employer recover the training amount?", category: "legal" }, training);
  } else {
    const money = findings.find((f) => /financial|payment|deposit|renewal/i.test(f.category));
    if (money) add({ id: `sq-money-${money.id}`, question: `Why is "${shortTitle(money)}" flagged?`, category: "risk" }, money);
  }

  // Fill remaining slots with the highest-severity findings not yet covered.
  const covered = new Set(suggestions.map((s) => s.findingId));
  for (const f of findings) {
    if (used.size >= 4) break;
    if (covered.has(f.id)) continue;
    if (f.severity === "critical_attention" || f.severity === "high_attention" || f.severity === "review") {
      add({ id: `sq-finding-${f.id}`, question: `Why is "${shortTitle(f)}" flagged?`, category: "risk" }, f);
    }
  }

  add({ id: "sq-hr", question: employment ? "What should I ask HR?" : "What should I ask the other party?", category: "action" });
  add({ id: "sq-lawyer", question: "What should I show a lawyer?", category: "action" });

  return suggestions.slice(0, 6);
}
