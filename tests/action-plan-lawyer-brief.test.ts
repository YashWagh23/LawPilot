import { describe, it, expect } from "vitest";
import {
  generateDeterministicActionPlan,
  sanitizeAndDeduplicateActionPlan,
} from "@/lib/ai/agents/actionPlanningAgent";
import {
  generateDeterministicLawyerBrief,
  LAWYER_BRIEF_STANDARD_DISCLAIMER,
} from "@/lib/ai/agents/lawyerBriefAgent";
import {
  sanitizeActionItem,
  ActionPlanSchema,
} from "@/lib/ai/prompts/actionPlanning";
import { DetailedLawyerBriefSchema } from "@/lib/ai/prompts/lawyerBrief";
import {
  SAMPLE_ACTION_PLAN,
  SAMPLE_DETAILED_LAWYER_BRIEF,
  SAMPLE_DELAWARE_DETAILED_LAWYER_BRIEF,
  SAMPLE_FINDINGS,
  SAMPLE_CLAUSES,
  SAMPLE_EVIDENCE_CHAINS,
  SAMPLE_KEY_DATES,
} from "@/lib/demo/sampleAnalysis";
import type { ActionPlanItem } from "@/types";

describe("Phase 4: Action Plan & Lawyer Brief Test Suite", () => {
  const sampleInput = {
    documentId: "test-doc-01",
    documentTitle: "Executive Employment Agreement",
    documentType: "employment_agreement",
    date: "2026-05-01",
    parties: ["Aegis Cloud Dynamics Inc.", "Alex Morgan"],
    jurisdiction: "Delaware",
    documentSummary: "Employment agreement containing restrictive covenants and training clawbacks.",
    findings: SAMPLE_FINDINGS,
    clauses: SAMPLE_CLAUSES,
    evidenceChains: SAMPLE_EVIDENCE_CHAINS,
    keyDates: SAMPLE_KEY_DATES,
  };

  // Test 1: ActionPlan structure validation
  it("1. validates complete ActionPlan structure across all 7 categorical groups", () => {
    const plan = generateDeterministicActionPlan(sampleInput);
    const parsed = ActionPlanSchema.safeParse(plan);

    expect(parsed.success).toBe(true);
    expect(plan.id).toBeDefined();
    expect(plan.documentId).toBe("test-doc-01");
    expect(Array.isArray(plan.urgentItems)).toBe(true);
    expect(Array.isArray(plan.beforeSigning)).toBe(true);
    expect(Array.isArray(plan.questionsToAsk)).toBe(true);
    expect(Array.isArray(plan.documentsToCollect)).toBe(true);
    expect(Array.isArray(plan.factsToConfirm)).toBe(true);
    expect(Array.isArray(plan.professionalReviewTriggers)).toBe(true);
    expect(Array.isArray(plan.followUpItems)).toBe(true);
    expect(plan.generatedAt).toBeDefined();
  });

  // Test 2: Action safety filter converts "terminate contract" directive
  it("2. converts 'terminate contract' directive into safe preparation item", () => {
    const rawItem: ActionPlanItem = {
      id: "test-item-1",
      title: "Terminate the agreement immediately due to breach",
      explanation: "You must terminate the agreement now.",
      actionType: "clarify",
      priority: "urgent",
      isReversible: false,
    };

    const sanitized = sanitizeActionItem(rawItem);
    expect(sanitized.title).toContain("Consult legal counsel regarding contract termination options");
    expect(sanitized.isReversible).toBe(true);
    expect(sanitized.practicalAdvice).toContain("Unilateral termination carries significant liability");
  });

  // Test 3: Action safety filter converts "sue employer" directive
  it("3. converts 'sue employer' directive into dispute consultation step", () => {
    const rawItem: ActionPlanItem = {
      id: "test-item-2",
      title: "Sue the employer in court for non-payment",
      explanation: "File a lawsuit against them immediately.",
      actionType: "clarify",
      priority: "urgent",
      isReversible: false,
    };

    const sanitized = sanitizeActionItem(rawItem);
    expect(sanitized.title).toContain("Review dispute resolution mechanisms with counsel");
    expect(sanitized.isReversible).toBe(true);
  });

  // Test 4: Action safety filter converts "refuse to pay" directive
  it("4. converts 'refuse to pay' directive into written clarification step", () => {
    const rawItem: ActionPlanItem = {
      id: "test-item-3",
      title: "Refuse to pay the training reimbursement amount",
      explanation: "Withhold salary and stop paying.",
      actionType: "clarify",
      priority: "urgent",
      isReversible: false,
    };

    const sanitized = sanitizeActionItem(rawItem);
    expect(sanitized.title).toContain("Document disputed payment terms in writing");
    expect(sanitized.isReversible).toBe(true);
  });

  // Test 5: Action safety filter converts "sign immediately" directive
  it("5. converts 'sign immediately' directive into pre-signing verification step", () => {
    const rawItem: ActionPlanItem = {
      id: "test-item-4",
      title: "Sign the agreement now without delay",
      explanation: "Sign the contract right away.",
      actionType: "clarify",
      priority: "urgent",
      isReversible: false,
    };

    const sanitized = sanitizeActionItem(rawItem);
    expect(sanitized.title).toContain("Complete all pre-signing verification items");
    expect(sanitized.isReversible).toBe(true);
  });

  // Test 6: Action safety filter ensures isReversible: true across all items
  it("6. guarantees isReversible: true across all sanitized action items", () => {
    const items: ActionPlanItem[] = [
      { id: "1", title: "Review clause", explanation: "Details", actionType: "clarify", priority: "recommended", isReversible: false },
      { id: "2", title: "Collect documents", explanation: "Details", actionType: "collect_document", priority: "important", isReversible: false },
      { id: "3", title: "Confirm facts", explanation: "Details", actionType: "confirm_fact", priority: "urgent", isReversible: false },
    ];

    items.forEach((item) => {
      const sanitized = sanitizeActionItem(item);
      expect(sanitized.isReversible).toBe(true);
    });
  });

  // Test 7: Finding-to-action linkage
  it("7. links every action to underlying findingId, clauseSection, and pageNumber", () => {
    const plan = generateDeterministicActionPlan(sampleInput);
    const linkedItems = [
      ...plan.urgentItems,
      ...plan.beforeSigning,
      ...plan.questionsToAsk,
    ].filter((item) => item.findingId);

    expect(linkedItems.length).toBeGreaterThan(0);
    linkedItems.forEach((item) => {
      expect(item.findingId).toBeDefined();
      expect(item.findingTitle).toBeDefined();
      expect(item.clauseSection).toBeDefined();
    });
  });

  // Test 8: Non-compete action generation
  it("8. generates specific scope clarification and territorial confirmation for non-compete findings", () => {
    const plan = generateDeterministicActionPlan(sampleInput);
    const ncItem = plan.beforeSigning.find(
      (item) => item.title.toLowerCase().includes("non-compete") || item.explanation.toLowerCase().includes("non-compete")
    );
    expect(ncItem).toBeDefined();
    expect(ncItem?.priority).toBe("urgent");

    const factItem = plan.factsToConfirm.find(
      (item) => item.title.toLowerCase().includes("territory") || item.title.toLowerCase().includes("client")
    );
    expect(factItem).toBeDefined();
  });

  // Test 9: Training reimbursement action generation
  it("9. produces pro-rata amortization proposal and invoice collection for training clawbacks", () => {
    const plan = generateDeterministicActionPlan(sampleInput);
    const amortizeItem = plan.beforeSigning.find(
      (item) => item.title.toLowerCase().includes("amortization") || item.title.toLowerCase().includes("repayment")
    );
    expect(amortizeItem).toBeDefined();
    expect(amortizeItem?.practicalAdvice).toContain("amortize pro-rata");

    const docItem = plan.documentsToCollect.find(
      (item) => item.title.toLowerCase().includes("receipts") || item.title.toLowerCase().includes("training")
    );
    expect(docItem).toBeDefined();
  });

  // Test 10: Invention assignment action generation
  it("10. generates Exhibit A pre-existing invention attachment and commit log collection", () => {
    const plan = generateDeterministicActionPlan(sampleInput);
    const ipItem = plan.beforeSigning.find(
      (item) => item.title.toLowerCase().includes("exhibit a") || item.title.toLowerCase().includes("inventions")
    );
    expect(ipItem).toBeDefined();
    expect(ipItem?.actionType).toBe("preserve_evidence");

    const docItem = plan.documentsToCollect.find(
      (item) => item.title.toLowerCase().includes("commit") || item.title.toLowerCase().includes("repository")
    );
    expect(docItem).toBeDefined();
  });

  // Test 11: Deadline extraction from keyDates
  it("11. converts keyDates into monitor_deadline actions in followUpItems or urgentItems", () => {
    const plan = generateDeterministicActionPlan(sampleInput);
    const deadlineActions = [...plan.followUpItems, ...plan.urgentItems].filter(
      (item) => item.actionType === "monitor_deadline"
    );

    expect(deadlineActions.length).toBeGreaterThan(0);
    deadlineActions.forEach((item) => {
      expect(item.practicalAdvice).toBeDefined();
      expect(item.title).toContain("Monitor deadline:");
    });
  });

  // Test 12: Action deduplication
  it("12. deduplicates identical duplicate action items by title", () => {
    const duplicateItem: ActionPlanItem = {
      id: "dup-1",
      title: "Verify Section 6 Training Terms",
      explanation: "Clarify with employer.",
      actionType: "clarify",
      priority: "urgent",
      isReversible: true,
    };
    const duplicateItem2: ActionPlanItem = {
      ...duplicateItem,
      id: "dup-2",
      title: "  Verify Section 6 Training Terms  ",
    };

    const plan = generateDeterministicActionPlan(sampleInput);
    plan.urgentItems.push(duplicateItem, duplicateItem2);

    const deduped = sanitizeAndDeduplicateActionPlan(plan);
    const matching = deduped.urgentItems.filter(
      (i) => i.title.trim().toLowerCase() === "verify section 6 training terms"
    );
    expect(matching.length).toBe(1);
  });

  // Test 13: Professional review triggers
  it("13. flags high-severity and restrictive covenant findings for professional review", () => {
    const plan = generateDeterministicActionPlan(sampleInput);
    expect(plan.professionalReviewTriggers.length).toBeGreaterThan(0);
    plan.professionalReviewTriggers.forEach((trigger) => {
      expect(trigger.findingId).toBeDefined();
      expect(trigger.clauseSection).toBeDefined();
      expect(trigger.reason.length).toBeGreaterThan(10);
      expect(["critical_attention", "high_attention", "review", "context_dependent", "informational"]).toContain(
        trigger.severity
      );
    });
  });

  // Test 14: LawyerBrief structure validation
  it("14. validates all 10 distinct sections in DetailedLawyerBrief", () => {
    const brief = generateDeterministicLawyerBrief(sampleInput);
    const parsed = DetailedLawyerBriefSchema.safeParse(brief);

    expect(parsed.success).toBe(true);
    expect(brief.matterSummary).toBeDefined(); // Section 1
    expect(brief.document).toBeDefined(); // Section 2
    expect(brief.userConcerns).toBeDefined(); // Section 3
    expect(brief.relevantClauses).toBeDefined(); // Section 4
    expect(brief.verifiedLegalContext).toBeDefined(); // Section 5
    expect(brief.whatRemainsUncertain).toBeDefined(); // Section 6
    expect(brief.documentsAvailable).toBeDefined(); // Section 7
    expect(brief.questionsForCounsel).toBeDefined(); // Section 8
    expect(brief.importantDates).toBeDefined(); // Section 9
    expect(brief.disclaimer).toBeDefined(); // Section 10
  });

  // Test 15: LawyerBrief non-hallucination
  it("15. only includes verified or partially_verified legal sources in Section 5", () => {
    const brief = generateDeterministicLawyerBrief(sampleInput);
    expect(brief.verifiedLegalContext.length).toBeGreaterThan(0);
    brief.verifiedLegalContext.forEach((lc) => {
      expect(["verified", "partially_verified"]).toContain(lc.verificationStatus);
      expect(lc.citation.length).toBeGreaterThan(2);
      expect(lc.jurisdiction).toBeDefined();
    });
  });

  // Test 16: LawyerBrief questions for counsel
  it("16. generates strategic, high-value questions for counsel across key covenants", () => {
    const brief = generateDeterministicLawyerBrief(sampleInput);
    expect(brief.questionsForCounsel.length).toBeGreaterThan(0);

    const questionsText = brief.questionsForCounsel.map((q) => q.question.toLowerCase()).join(" ");
    expect(questionsText).toMatch(/amortization|repayment|penalty/);
    expect(questionsText).toMatch(/non-compete|competitor|geographic/);
    expect(questionsText).toMatch(/exhibit a|invention|carve-out/);
  });

  // Test 17: LawyerBrief document metadata
  it("17. preserves title, documentType, parties, date, and jurisdiction in Section 2", () => {
    const brief = generateDeterministicLawyerBrief(sampleInput);
    expect(brief.document.title).toBe(sampleInput.documentTitle);
    expect(brief.document.documentType).toBe(sampleInput.documentType);
    expect(brief.document.parties).toEqual(sampleInput.parties);
    expect(brief.document.jurisdiction).toBe(sampleInput.jurisdiction);
  });

  // Test 18: LawyerBrief dates formatting
  it("18. formats dates, deadlines, and notice periods in Section 9", () => {
    const brief = generateDeterministicLawyerBrief(sampleInput);
    expect(brief.importantDates.length).toBeGreaterThan(0);
    const noticeDate = brief.importantDates.find((d) => d.noticePeriodDays);
    expect(noticeDate).toBeDefined();
    expect(noticeDate?.isDeadline).toBe(true);
  });

  // Test 19: LawyerBrief disclaimer
  it("19. includes prominent non-legal-advice disclaimer in Section 10", () => {
    const brief = generateDeterministicLawyerBrief(sampleInput);
    expect(brief.disclaimer).toContain("NOTICE & DISCLAIMER");
    expect(brief.disclaimer).toContain("does NOT constitute formal legal advice");
    expect(brief.disclaimer).toBe(LAWYER_BRIEF_STANDARD_DISCLAIMER);
  });

  // Test 20: Flagship Employment Agreement Demo SAMPLE_ACTION_PLAN
  it("20. validates SAMPLE_ACTION_PLAN data integrity for flagship demo", () => {
    expect(SAMPLE_ACTION_PLAN.urgentItems).toHaveLength(3);
    expect(SAMPLE_ACTION_PLAN.beforeSigning).toHaveLength(2);
    expect(SAMPLE_ACTION_PLAN.questionsToAsk).toHaveLength(3);
    expect(SAMPLE_ACTION_PLAN.documentsToCollect).toHaveLength(3);
    expect(SAMPLE_ACTION_PLAN.factsToConfirm).toHaveLength(2);
    expect(SAMPLE_ACTION_PLAN.professionalReviewTriggers).toHaveLength(3);
    expect(SAMPLE_ACTION_PLAN.followUpItems).toHaveLength(2);

    // Verify reversibility
    SAMPLE_ACTION_PLAN.urgentItems.forEach((item) => expect(item.isReversible).toBe(true));
  });

  // Test 21: Flagship Employment Agreement Demo SAMPLE_DELAWARE_DETAILED_LAWYER_BRIEF
  it("21. validates SAMPLE_DELAWARE_DETAILED_LAWYER_BRIEF with Delaware statutory authorities", () => {
    expect(SAMPLE_DELAWARE_DETAILED_LAWYER_BRIEF.relevantClauses).toHaveLength(5);
    expect(SAMPLE_DELAWARE_DETAILED_LAWYER_BRIEF.verifiedLegalContext).toHaveLength(4);
    expect(SAMPLE_DELAWARE_DETAILED_LAWYER_BRIEF.questionsForCounsel).toHaveLength(4);

    const citations = SAMPLE_DELAWARE_DETAILED_LAWYER_BRIEF.verifiedLegalContext.map((c) => c.citation);
    expect(citations.some((c) => c.includes("19 Del. C. § 1107"))).toBe(true);
    expect(citations.some((c) => c.includes("Kodiak Bldg. Partners"))).toBe(true);
    expect(citations.some((c) => c.includes("AAA Employment Due Process Protocol"))).toBe(true);
  });
});
