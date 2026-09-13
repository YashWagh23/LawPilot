import { describe, it, expect } from "vitest";
import {
  generateDeterministicActionPlan,
  sanitizeAndDeduplicateActionPlan,
  assertUniqueActionIds,
  buildActionItemId,
} from "@/lib/ai/agents/actionPlanningAgent";
import { toSimpleActionPresentation } from "@/lib/analysis/presentationTransformer";
import type { ActionPlan, ActionPlanItem, Finding } from "@/types";

describe("Bug Fix: Unique ActionPlan Item IDs & React Key Collision Regression", () => {
  const mockFindingId = "finding-doc-1789319184576-4w3aq-7";

  const trainingFinding: Finding = {
    id: mockFindingId,
    title: "Early Departure Training Bond Reimbursement (₹4,50,000)",
    category: "Financial Obligation",
    severity: "high_attention",
    description: "Requires full ₹4,50,000 reimbursement within 18 months of employment.",
    whyItMatters: "May create a large monetary liability upon resignation.",
    plainEnglishSummary: "Requires full ₹4,50,000 repayment if leaving early.",
    actionableAdvice: "Propose monthly amortization for training costs.",
    clauseId: "clause-sec-6",
    uncertainties: ["Actual third-party expenditure documentation"],
    clauseReference: {
      section: "Section 6",
      clauseId: "clause-sec-6",
      pageNumber: 2,
    },
    evidence: {
      findingId: mockFindingId,
      documentId: "doc-1789319184576-4w3aq",
      clauseId: "clause-sec-6",
      section: "Section 6",
      quotedText: "Employee must repay INR 4,50,000 if leaving within 18 months.",
      pageNumber: 2,
    },
  };

  const nonCompeteFinding: Finding = {
    id: "finding-doc-1789319184576-4w3aq-8",
    title: "12-Month Nationwide Non-Compete",
    category: "Restrictive Covenant",
    severity: "critical_attention",
    description: "Prohibits working for any competitor anywhere in India for 12 months.",
    whyItMatters: "Broadly restricts professional mobility across the jurisdiction.",
    plainEnglishSummary: "Strict non-compete for 1 year.",
    actionableAdvice: "Limit to named competitors or narrow scope.",
    clauseId: "clause-sec-9",
    uncertainties: ["Territorial applicability to remote work"],
    clauseReference: {
      section: "Section 9",
      clauseId: "clause-sec-9",
      pageNumber: 3,
    },
    evidence: {
      findingId: "finding-doc-1789319184576-4w3aq-8",
      documentId: "doc-1789319184576-4w3aq",
      clauseId: "clause-sec-9",
      section: "Section 9",
      quotedText: "Employee shall not engage in competing business for 12 months.",
      pageNumber: 3,
    },
  };

  const sampleInput = {
    documentId: "doc-1789319184576-4w3aq",
    documentTitle: "Employment Agreement",
    documentSummary: "Test agreement with training bond and non-compete.",
    findings: [trainingFinding, nonCompeteFinding],
    keyDates: [], // No immediate deadlines, which triggers urgent elevation
  };

  it("1. reproduces and verifies the exact training bond finding generates strictly unique IDs", () => {
    const plan = generateDeterministicActionPlan(sampleInput);

    // Run the domain invariant check
    const validation = assertUniqueActionIds(plan);
    expect(validation.valid).toBe(true);
    expect(validation.duplicates).toHaveLength(0);

    // Verify urgent elevation moved candidate instead of cloning
    const urgentTraining = plan.urgentItems.find((i) => i.findingId === mockFindingId);
    const beforeSigningTraining = plan.beforeSigning.find((i) => i.findingId === mockFindingId);

    // An item should not be duplicated across both urgentItems and beforeSigning
    expect(urgentTraining).toBeDefined();
    expect(beforeSigningTraining).toBeUndefined();

    // Verify all IDs across all categories are unique
    const allIds = [
      ...plan.urgentItems,
      ...plan.beforeSigning,
      ...plan.questionsToAsk,
      ...plan.documentsToCollect,
      ...plan.factsToConfirm,
      ...plan.followUpItems,
    ].map((i) => i.id);

    const uniqueIds = new Set(allIds);
    expect(uniqueIds.size).toBe(allIds.length);
  });

  it("2. verifies multiple distinct actions attached to the same finding maintain unique IDs", () => {
    const plan = generateDeterministicActionPlan(sampleInput);

    // Non-compete produces actions in beforeSigning, factsToConfirm, questionsToAsk
    const ncActions = [
      ...plan.urgentItems,
      ...plan.beforeSigning,
      ...plan.questionsToAsk,
      ...plan.documentsToCollect,
      ...plan.factsToConfirm,
      ...plan.followUpItems,
    ].filter((i) => i.findingId === "finding-doc-1789319184576-4w3aq-8");

    expect(ncActions.length).toBeGreaterThanOrEqual(2);

    const ncIds = ncActions.map((i) => i.id);
    const uniqueNcIds = new Set(ncIds);
    expect(uniqueNcIds.size).toBe(ncIds.length);
  });

  it("3. verifies true duplicate actions are deduplicated across categories", () => {
    const duplicateItem: ActionPlanItem = {
      id: "action-train-cap-finding-doc-1789319184576-4w3aq-7",
      title: "Request pro-rata monthly amortization for training repayment",
      explanation: "Clawback amortization request.",
      actionType: "clarify",
      priority: "urgent",
      findingId: mockFindingId,
      isReversible: true,
    };

    const duplicateItemClone: ActionPlanItem = {
      ...duplicateItem,
      id: "action-train-cap-finding-doc-1789319184576-4w3aq-7",
    };

    const uncleanedPlan: ActionPlan = {
      id: "plan-test",
      documentId: "doc-1789319184576-4w3aq",
      summary: "Test summary",
      urgentItems: [duplicateItem],
      beforeSigning: [duplicateItemClone],
      questionsToAsk: [],
      documentsToCollect: [],
      factsToConfirm: [],
      professionalReviewTriggers: [],
      followUpItems: [],
      generatedAt: new Date().toISOString(),
    };

    const cleanedPlan = sanitizeAndDeduplicateActionPlan(uncleanedPlan);
    const validation = assertUniqueActionIds(cleanedPlan);

    expect(validation.valid).toBe(true);
    expect(cleanedPlan.urgentItems.length + cleanedPlan.beforeSigning.length).toBe(1);
  });

  it("4. disambiguates colliding IDs if distinct actions have same ID string", () => {
    const actionA: ActionPlanItem = {
      id: "action-train-cap-finding-doc-1789319184576-4w3aq-7",
      title: "Request pro-rata amortization",
      explanation: "Explanation A",
      actionType: "clarify",
      priority: "urgent",
      findingId: mockFindingId,
      isReversible: true,
    };

    const actionB: ActionPlanItem = {
      id: "action-train-cap-finding-doc-1789319184576-4w3aq-7", // Deliberate duplicate ID
      title: "Confirm training third-party invoices", // Distinct semantic title
      explanation: "Explanation B",
      actionType: "collect_document",
      priority: "important",
      findingId: mockFindingId,
      isReversible: true,
    };

    const uncleanedPlan: ActionPlan = {
      id: "plan-test-collision",
      documentId: "doc-test",
      summary: "Test collision resolution",
      urgentItems: [actionA],
      beforeSigning: [actionB],
      questionsToAsk: [],
      documentsToCollect: [],
      factsToConfirm: [],
      professionalReviewTriggers: [],
      followUpItems: [],
      generatedAt: new Date().toISOString(),
    };

    const cleanedPlan = sanitizeAndDeduplicateActionPlan(uncleanedPlan);
    const validation = assertUniqueActionIds(cleanedPlan);

    expect(validation.valid).toBe(true);
    expect(cleanedPlan.urgentItems).toHaveLength(1);
    expect(cleanedPlan.beforeSigning).toHaveLength(1);
    expect(cleanedPlan.urgentItems[0].id).not.toBe(cleanedPlan.beforeSigning[0].id);
    expect(cleanedPlan.beforeSigning[0].id).toContain("-2");
  });

  it("5. verifies IDs are deterministic and stable across repeated generation with identical inputs", () => {
    const plan1 = generateDeterministicActionPlan(sampleInput);
    const plan2 = generateDeterministicActionPlan(sampleInput);

    const ids1 = [
      ...plan1.urgentItems,
      ...plan1.beforeSigning,
      ...plan1.questionsToAsk,
      ...plan1.documentsToCollect,
      ...plan1.factsToConfirm,
      ...plan1.followUpItems,
    ].map((i) => i.id);

    const ids2 = [
      ...plan2.urgentItems,
      ...plan2.beforeSigning,
      ...plan2.questionsToAsk,
      ...plan2.documentsToCollect,
      ...plan2.factsToConfirm,
      ...plan2.followUpItems,
    ].map((i) => i.id);

    expect(ids1).toEqual(ids2);
  });

  it("6. verifies toSimpleActionPresentation never outputs duplicate IDs", () => {
    const plan = generateDeterministicActionPlan(sampleInput);
    const simpleItems = toSimpleActionPresentation(plan);

    expect(simpleItems.length).toBeGreaterThan(0);
    const simpleIds = simpleItems.map((i) => i.id);
    const uniqueSimpleIds = new Set(simpleIds);
    expect(uniqueSimpleIds.size).toBe(simpleIds.length);
  });

  it("7. buildActionItemId creates structured, deterministic slug without special character corruption", () => {
    const id = buildActionItemId(
      "doc-1789319184576-4w3aq",
      "before-signing",
      "train-cap",
      "finding-doc-1789319184576-4w3aq-7"
    );

    expect(id).toMatch(/^act_[a-z0-9-]+_[a-z0-9-]+_[a-z0-9-]+_[a-z0-9-]+$/);
    expect(id).toContain("before-signing");
    expect(id).toContain("train-cap");
  });

  it("8. renders ActionPlanView with real document plan without duplicate key console errors", async () => {
    const { renderToString } = await import("react-dom/server");
    const { ActionPlanView } = await import("@/components/action-plan/ActionPlan");
    const React = await import("react");

    const plan = generateDeterministicActionPlan(sampleInput);
    const consoleErrors: string[] = [];
    const originalError = console.error;
    console.error = (...args: unknown[]) => {
      consoleErrors.push(args.map(String).join(" "));
    };

    try {
      const html = renderToString(React.createElement(ActionPlanView, { actionPlan: plan }));
      expect(html).toContain("Your Next Steps");
      const keyErrors = consoleErrors.filter(
        (msg) => msg.includes("same key") || msg.includes("duplicate") || msg.includes("identical key")
      );
      expect(keyErrors).toHaveLength(0);
    } finally {
      console.error = originalError;
    }
  });
});
