import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import React from "react";
import { renderToString } from "react-dom/server";
import { NextRequest } from "next/server";
import { SAMPLE_ANALYSIS_REPORT } from "@/lib/demo/sampleAnalysis";
import {
  NEGOTIATION_DRAFT_DISCLAIMER,
  buildNegotiationGrounding,
  buildNegotiationInputFromReport,
  detectNegotiationTopic,
  extractDuration,
  findUngroundedCitations,
  generateNegotiationDraft,
  isNegotiableSeverity,
} from "@/lib/negotiation/negotiationEngine";
import { generateNegotiationPlan, mergeAiOutput } from "@/lib/ai/agents/negotiationAgent";
import {
  getSavedNegotiationDrafts,
  isNegotiationDraftSaved,
  removeNegotiationDraft,
  saveNegotiationDraft,
} from "@/lib/negotiation/negotiationStore";
import { toFindingPresentation } from "@/lib/analysis/presentationTransformer";
import { FindingDetailModal } from "@/components/analysis/FindingDetailModal";
import { NegotiationCopilotModal } from "@/components/negotiation/NegotiationCopilotModal";
import { POST } from "@/app/api/analysis/negotiate/route";
import type { EvidenceChain, Finding, NegotiationLegalBasis } from "@/types";

const report = SAMPLE_ANALYSIS_REPORT;

function draftFor(findingId: string) {
  const input = buildNegotiationInputFromReport(report, findingId);
  if (!input) throw new Error(`finding ${findingId} missing from demo report`);
  return { input, draft: generateNegotiationDraft(input) };
}

function allDraftText(d: ReturnType<typeof generateNegotiationDraft>): string {
  return [
    d.issueExplanation,
    d.proposedClause,
    d.proposedClauseRationale,
    d.fallbackPosition,
    d.message.subject,
    d.message.body,
    ...d.verifyBeforeAccepting,
  ].join("\n");
}

describe("Negotiation Copilot — grounded draft engine", () => {
  it("produces all five required parts for every material demo finding", () => {
    for (const finding of report.findings.filter((f) => isNegotiableSeverity(f.severity))) {
      const { draft } = draftFor(finding.id);
      expect(draft.issueExplanation.length).toBeGreaterThan(40);
      expect(draft.proposedClause.length).toBeGreaterThan(40);
      expect(draft.fallbackPosition.length).toBeGreaterThan(20);
      expect(draft.message.body).toContain("Suggested wording (draft)");
      expect(draft.verifyBeforeAccepting.length).toBeGreaterThanOrEqual(3);
      expect(draft.disclaimer).toBe(NEGOTIATION_DRAFT_DISCLAIMER);
      expect(draft.generationMode).toBe("grounded_template");
      // The lawyer-review check is mandatory on every draft
      expect(draft.verifyBeforeAccepting.some((v) => /qualified lawyer/i.test(v))).toBe(true);
    }
  });

  it("detects the negotiation topic for each demo finding", () => {
    const topics = Object.fromEntries(
      report.findings.map((f) => [f.id, detectNegotiationTopic(f)])
    );
    expect(topics["finding-emp-1"]).toBe("training_bond");
    expect(topics["finding-emp-2"]).toBe("notice_period");
    expect(topics["finding-emp-3"]).toBe("intellectual_property");
    expect(topics["finding-emp-4"]).toBe("non_compete");
    expect(topics["finding-emp-5"]).toBe("dispute_resolution");
  });

  it("uses values from the actual clause text for the training bond", () => {
    const { draft } = draftFor("finding-emp-1");
    expect(draft.proposedClause).toContain("INR 4,50,000");
    expect(draft.proposedClause).toContain("18 months");
    expect(draft.proposedClause).toContain("1/18");
    expect(draft.grounding.section).toBe("Section 6");
    expect(draft.grounding.pageNumber).toBe(2);
  });

  it("parses written-out durations like 'eighteen (18) months'", () => {
    expect(extractDuration("within eighteen (18) continuous months")?.label).toBe("18 months");
    expect(extractDuration("90 calendar days' notice", /days?/i)?.value).toBe(90);
  });

  it("only cites sources that are already in the finding's Evidence Chain", () => {
    for (const finding of report.findings.filter((f) => isNegotiableSeverity(f.severity))) {
      const { input, draft } = draftFor(finding.id);
      const chainSourceIds = new Set((input.evidenceChain?.legalSources || []).map((s) => s.id));
      for (const basis of draft.grounding.legalBasis) {
        expect(chainSourceIds.has(basis.sourceId)).toBe(true);
      }
      // Nothing in the draft may cite authority outside the chain...
      expect(findUngroundedCitations(allDraftText(draft), draft.grounding.legalBasis)).toEqual([]);
      // ...and the generated wording itself never names any authority at all
      const generated = [draft.proposedClause, draft.fallbackPosition, draft.message.body].join("\n");
      expect(findUngroundedCitations(generated, [])).toEqual([]);
    }
  });

  it("drops unverified or invalid sources from the grounding", () => {
    const chain = report.evidenceChains[0];
    const tampered: EvidenceChain = {
      ...chain,
      legalSources: [
        { ...chain.legalSources[0], id: "src-unverified", verificationStatus: "unsupported" },
        { ...chain.legalSources[0], id: "src-no-citation", citation: "n/a" },
        chain.legalSources[1],
      ],
    };
    const grounding = buildNegotiationGrounding(chain.finding, tampered);
    expect(grounding.legalBasis.map((b) => b.sourceId)).toEqual([chain.legalSources[1].id]);
  });

  it("flags drafts with no verified authority and says so in the checklist", () => {
    const finding = report.findings[0];
    const draft = generateNegotiationDraft({ documentId: "doc-x", finding, evidenceChain: null });
    expect(draft.grounding.legalBasis).toEqual([]);
    expect(draft.grounding.hasVerifiedAuthority).toBe(false);
    expect(draft.verifyBeforeAccepting.some((v) => /No verified legal source/i.test(v))).toBe(true);
  });

  it("addresses the message to HR for employment agreements", () => {
    const { draft } = draftFor("finding-emp-1");
    expect(draft.message.recipient).toMatch(/^HR \/ Hiring Manager/);
  });
});

describe("Negotiation Copilot — citation guard", () => {
  const allowed: NegotiationLegalBasis[] = [
    {
      sourceId: "s1",
      citation: "Indian Contract Act, 1872 § 74",
      title: "Indian Contract Act, 1872 § 74 (Compensation for Breach)",
      verificationStatus: "verified",
    },
    {
      sourceId: "s2",
      citation: "Kailash Nath Associates v. Delhi Development Authority, (2015) 4 SCC 136",
      title: "Kailash Nath Associates v. Delhi Development Authority",
      verificationStatus: "verified",
    },
  ];

  it("accepts references that match the Evidence Chain", () => {
    const text =
      "Under the Indian Contract Act, 1872 (§ 74), and as in Kailash Nath Associates v. Delhi Development Authority, (2015) 4 SCC 136, courts look at actual loss.";
    expect(findUngroundedCitations(text, allowed)).toEqual([]);
  });

  it("rejects statutes, cases, and sections that are not in the Evidence Chain", () => {
    const text =
      "See the Specific Relief Act, 1963, Foo Industries v. Bar Limited, (2019) 3 SCC 12, and § 99.";
    const violations = findUngroundedCitations(text, allowed);
    expect(violations.some((v) => v.includes("Specific Relief Act, 1963"))).toBe(true);
    expect(violations.some((v) => v.includes("Industries v. Bar"))).toBe(true);
    expect(violations.some((v) => v.includes("SCC"))).toBe(true);
    expect(violations).toContain("§ 99");
  });
});

describe("Negotiation Copilot — AI output merge", () => {
  const { draft: base } = draftFor("finding-emp-1");
  const cleanOutput = {
    issueExplanation: "Section 6 asks you to repay a fixed sum if you leave early. The goal is to tie it to real costs.",
    proposedClause: "The Employee shall reimburse only documented third-party training costs, reducing pro-rata monthly.",
    proposedClauseRationale: "Ties repayment to evidence and time served.",
    fallbackPosition: "Ask for a lower cap of [amount] if pro-rata is refused.",
    messageSubject: "Question about Section 6",
    messageBody: "Hello, could we revise Section 6 so repayment reflects documented costs and reduces monthly? Thanks.",
    verifyBeforeAccepting: ["Ask for the training invoices."],
  };

  it("accepts clean output but keeps code-owned grounding, disclaimer, and lawyer check", () => {
    const merged = mergeAiOutput(base, cleanOutput, "Maharashtra, India");
    expect(merged).not.toBeNull();
    expect(merged!.generationMode).toBe("ai_assisted");
    expect(merged!.grounding).toEqual(base.grounding);
    expect(merged!.disclaimer).toBe(NEGOTIATION_DRAFT_DISCLAIMER);
    expect(merged!.verifyBeforeAccepting).toContain("Ask for the training invoices.");
    expect(merged!.verifyBeforeAccepting.some((v) => /qualified lawyer licensed in Maharashtra, India/.test(v))).toBe(true);
  });

  it("rejects output that invents legal authority", () => {
    const merged = mergeAiOutput(base, {
      ...cleanOutput,
      fallbackPosition: "Rely on the Payment of Wages Act, 1936 to refuse any deduction.",
    });
    expect(merged).toBeNull();
  });

  it("rejects output that claims legal correctness", () => {
    expect(mergeAiOutput(base, { ...cleanOutput, proposedClauseRationale: "This wording is legally enforceable." })).toBeNull();
  });

  it("rejects malformed output", () => {
    expect(mergeAiOutput(base, { issueExplanation: "too short" })).toBeNull();
  });

  it("falls back to the grounded template when no AI key is configured", async () => {
    const prev = process.env.GEMINI_API_KEY;
    delete process.env.GEMINI_API_KEY;
    try {
      const input = buildNegotiationInputFromReport(report, "finding-emp-4")!;
      const draft = await generateNegotiationPlan(input);
      expect(draft.generationMode).toBe("grounded_template");
      expect(draft.topic).toBe("non_compete");
    } finally {
      if (prev !== undefined) process.env.GEMINI_API_KEY = prev;
    }
  });
});

describe("Negotiation Copilot — API route", () => {
  const prevKey = process.env.GEMINI_API_KEY;
  beforeEach(() => {
    delete process.env.GEMINI_API_KEY;
  });
  afterEach(() => {
    if (prevKey !== undefined) process.env.GEMINI_API_KEY = prevKey;
  });

  const post = (body: unknown) =>
    POST(
      new NextRequest("http://localhost:3000/api/analysis/negotiate", {
        method: "POST",
        body: JSON.stringify(body),
        headers: { "Content-Type": "application/json", "x-forwarded-for": `10.9.${Math.floor(Math.random() * 250)}.1` },
      })
    );

  it("returns a grounded draft for a demo finding", async () => {
    const res = await post({ reportId: "demo-employment-agreement", findingId: "finding-emp-1" });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.draft.findingId).toBe("finding-emp-1");
    expect(data.draft.disclaimer).toBe(NEGOTIATION_DRAFT_DISCLAIMER);
  });

  it("ignores a tampered client context when the server has the report", async () => {
    const tampered: Finding = { ...report.findings[0], title: "Injected title" };
    const res = await post({
      reportId: "demo-employment-agreement",
      findingId: "finding-emp-1",
      clientContext: { finding: tampered },
    });
    const data = await res.json();
    expect(data.draft.findingTitle).not.toContain("Injected");
  });

  it("validates input", async () => {
    expect((await post({ findingId: "x" })).status).toBe(400);
    expect((await post({ reportId: "demo-employment-agreement", findingId: "nope" })).status).toBe(404);
  });

  it("refuses informational findings", async () => {
    const informational: Finding = { ...report.findings[0], id: "f-info", severity: "informational" };
    const res = await post({
      reportId: "local-only-report",
      findingId: "f-info",
      clientContext: { finding: informational },
    });
    expect(res.status).toBe(422);
  });
});

describe("Negotiation Copilot — Next Steps store", () => {
  beforeEach(() => {
    let store: Record<string, string> = {};
    const mockStorage = {
      getItem: (key: string) => store[key] ?? null,
      setItem: (key: string, value: string) => {
        store[key] = value;
      },
      removeItem: (key: string) => {
        delete store[key];
      },
      clear: () => {
        store = {};
      },
    };
    Object.defineProperty(global, "localStorage", { value: mockStorage, writable: true, configurable: true });
    Object.defineProperty(global, "window", {
      value: {
        localStorage: mockStorage,
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: vi.fn(() => true),
      },
      writable: true,
      configurable: true,
    });
  });

  it("saves one draft per finding, scoped to its document, and removes it", () => {
    const { draft } = draftFor("finding-emp-1");
    expect(saveNegotiationDraft(draft)).toBe(true);
    expect(saveNegotiationDraft({ ...draft, fallbackPosition: "updated" })).toBe(true);

    const saved = getSavedNegotiationDrafts(draft.documentId);
    expect(saved).toHaveLength(1);
    expect(saved[0].fallbackPosition).toBe("updated");
    expect(isNegotiationDraftSaved(draft.documentId, "finding-emp-1")).toBe(true);
    expect(getSavedNegotiationDrafts("another-document")).toEqual([]);

    removeNegotiationDraft(draft.documentId, "finding-emp-1");
    expect(getSavedNegotiationDrafts(draft.documentId)).toEqual([]);
  });
});

describe("Negotiation Copilot — UI entry points", () => {
  const presentations = report.findings.map((f) => toFindingPresentation(f, report));

  it("offers 'Negotiate this' on material findings in the finding modal", () => {
    const html = renderToString(
      React.createElement(FindingDetailModal, {
        finding: presentations[0],
        isOpen: true,
        onClose: () => {},
        onNegotiate: () => {},
      })
    );
    expect(html).toContain("Negotiate this");
  });

  it("does not offer negotiation for informational findings", () => {
    const info = toFindingPresentation({ ...report.findings[0], severity: "informational" }, report);
    const html = renderToString(
      React.createElement(FindingDetailModal, { finding: info, isOpen: true, onClose: () => {}, onNegotiate: () => {} })
    );
    expect(html).not.toContain("Negotiate this");
  });

  it("always shows the draft-for-review notice in the copilot", () => {
    const html = renderToString(
      React.createElement(NegotiationCopilotModal, {
        report,
        finding: presentations[0],
        isOpen: true,
        onClose: () => {},
      })
    );
    expect(html).toContain("Draft for review, not legal advice.");
    expect(html).toContain("Negotiation Copilot");
  });

  it("renders the grounded draft immediately, before any AI refinement returns", () => {
    const html = renderToString(
      React.createElement(NegotiationCopilotModal, {
        report,
        finding: presentations[0],
        isOpen: true,
        onClose: () => {},
      })
    );
    expect(html).toContain("1/18 per month");
    expect(html).toContain("Refining wording with AI");
    expect(html).not.toContain("Preparing a grounded draft");
  });
});
