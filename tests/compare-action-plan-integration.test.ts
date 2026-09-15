import { describe, it, expect, beforeEach } from "vitest";
import React from "react";
import { renderToString } from "react-dom/server";
import {
  addCompareActionItem,
  getCompareActionItems,
  isCompareActionItemAdded,
  removeCompareActionItem,
  toggleCompareActionItemCompleted,
} from "@/lib/comparison/compareActionStore";
import {
  matchClausesSemantically,
} from "@/lib/comparison/clauseMatcher";
import {
  analyzeAllClauseDifferences,
} from "@/lib/comparison/semanticChangeDetector";
import {
  DEMO_PREVIOUS_CLAUSES,
  DEMO_CURRENT_CLAUSES,
  FLAGSHIP_DEMO_COMPARISON,
} from "@/lib/demo/compareDemoData";
import { ActionPlanView } from "@/components/action-plan/ActionPlan";
import { SideBySideClauseView } from "@/components/compare/SideBySideClauseView";
import type { ActionPlan, ActionPlanItem } from "@/types";

describe("Compare → Action Plan Integration & Persistence Suite", () => {
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
    Object.defineProperty(global, "localStorage", {
      value: mockStorage,
      writable: true,
      configurable: true,
    });
    Object.defineProperty(global, "window", {
      value: {
        localStorage: mockStorage,
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => true,
      },
      writable: true,
      configurable: true,
    });
  });

  // 1. Adding a comparison action creates a persisted item
  it("1. adding a comparison action creates a persisted item in localStorage", () => {
    const item: ActionPlanItem = {
      id: "action-compare-0-probation",
      title: "Request 3-month probation cap and performance criteria",
      explanation: "Clarify that 6-month probation will not be extended unilaterally.",
      actionType: "clarify",
      priority: "important",
      clauseSection: "Section 1",
      isReversible: true,
      completed: false,
      practicalAdvice: "What specific metrics determine successful completion?",
    };

    const added = addCompareActionItem(item);
    expect(added).toBe(true);

    const stored = getCompareActionItems();
    expect(stored.length).toBe(1);
    expect(stored[0].id).toBe(item.id);
    expect(stored[0].title).toBe(item.title);
    expect(stored[0].explanation).toBe(item.explanation);
    expect(stored[0].clauseSection).toBe("Section 1");
    expect(stored[0].priority).toBe("important");
    expect(stored[0].isReversible).toBe(true);
  });

  // 2. Re-adding the same comparison change does not create a duplicate
  it("2. re-adding the same comparison change does not create a duplicate", () => {
    const item: ActionPlanItem = {
      id: "action-compare-0-probation",
      title: "Request 3-month probation cap and performance criteria",
      explanation: "Clarify that 6-month probation will not be extended unilaterally.",
      actionType: "clarify",
      priority: "important",
      isReversible: true,
    };

    const firstAdd = addCompareActionItem(item);
    expect(firstAdd).toBe(true);

    // Attempt second add with exact same ID
    const duplicateAddById = addCompareActionItem(item);
    expect(duplicateAddById).toBe(false);

    // Attempt third add with different ID but same title
    const duplicateAddByTitle = addCompareActionItem({
      ...item,
      id: "action-compare-diff-id",
    });
    expect(duplicateAddByTitle).toBe(false);

    // Store should still have exactly 1 item
    const stored = getCompareActionItems();
    expect(stored.length).toBe(1);
  });

  // 3. Deterministic comparison action ID remains stable across runs and time
  it("3. deterministic comparison action ID remains stable across repeated runs", () => {
    const pairs = matchClausesSemantically(DEMO_PREVIOUS_CLAUSES, DEMO_CURRENT_CLAUSES);
    const run1 = analyzeAllClauseDifferences(pairs);
    const run2 = analyzeAllClauseDifferences(pairs);

    expect(run1.length).toBeGreaterThan(0);
    expect(run1.length).toBe(run2.length);

    for (let i = 0; i < run1.length; i++) {
      const action1 = run1[i].suggestedActionItem;
      const action2 = run2[i].suggestedActionItem;

      // Deterministic stable ID check
      expect(action1.id).toBe(action2.id);
      expect(action1.id).toMatch(/^action-compare-\d+-/);
      expect(action1.id).not.toContain("NaN");
      expect(action1.id).not.toContain("undefined");

      // Verify no Date.now() randomness
      expect(action1.id).toBe(`action-compare-${i}-${(run1[i].clauseTitle || "clause").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "clause"}`);
    }
  });

  // 4. Existing saved item is recognized by the Compare button on render
  it("4. existing saved item is recognized by the Compare button on render", () => {
    const item: ActionPlanItem = {
      id: "action-compare-0-probation-period",
      title: "Request 3-month probation cap and performance criteria",
      explanation: "Clarify terms",
      actionType: "clarify",
      priority: "important",
      isReversible: true,
    };
    addCompareActionItem(item);

    const change = {
      ...FLAGSHIP_DEMO_COMPARISON.changes[0],
      suggestedActionItem: item,
    };

    const html = renderToString(
      React.createElement(SideBySideClauseView, {
        change,
        onAskLawPilot: () => {},
      })
    );
    expect(html).toContain("Saved to Action Plan");
    expect(html).not.toContain("Add to Action Plan");
  });

  // 5. Comparison action appears seamlessly merged into the unified Action Plan
  it("5. comparison action appears seamlessly merged into the unified Action Plan", () => {
    const compareItem: ActionPlanItem = {
      id: "action-compare-0-probation-clause",
      title: "Request 3-month probation cap and performance criteria",
      explanation: "Clarify that 6-month probation will not be extended unilaterally.",
      actionType: "clarify",
      priority: "important",
      clauseSection: "Section 1",
      isReversible: true,
      practicalAdvice: "Ask HR: What specific KPIs define passing probation?",
    };
    addCompareActionItem(compareItem);

    const mockPlan: ActionPlan = {
      id: "plan-test-1",
      documentId: "doc-test-1",
      summary: "Test action plan",
      urgentItems: [
        {
          id: "action-1",
          title: "Verify Non-Compete Scope with Legal Counsel",
          explanation: "Consult an attorney regarding Maharashtra non-compete enforceability.",
          actionType: "clarify",
          priority: "urgent",
          isReversible: true,
        },
      ],
      beforeSigning: [],
      questionsToAsk: [],
      documentsToCollect: [],
      factsToConfirm: [],
      professionalReviewTriggers: [],
      followUpItems: [],
      generatedAt: new Date().toISOString(),
    };

    const html = renderToString(
      React.createElement(ActionPlanView, {
        actionPlan: mockPlan,
      })
    );

    // Must contain both the original report item AND the comparison item
    expect(html).toContain("Verify Non-Compete Scope with Legal Counsel");
    expect(html).toContain("Request 3-month probation cap and performance criteria");
    expect(html).toContain("Added from Comparison");
    expect(html).toContain("From Comparison · Section 1");
  });

  // 6. Completion state persists after reload and storage round-trip
  it("6. completion state persists after reload and storage round-trip", () => {
    const compareItem: ActionPlanItem = {
      id: "action-compare-0-probation",
      title: "Request 3-month probation cap",
      explanation: "Clarify terms",
      actionType: "clarify",
      priority: "important",
      isReversible: true,
      completed: false,
    };
    addCompareActionItem(compareItem);

    // Toggle completion in store
    const toggled = toggleCompareActionItemCompleted(compareItem.id, true);
    expect(toggled).toBe(true);

    // Verify stored state
    const stored = getCompareActionItems();
    expect(stored[0].completed).toBe(true);
    expect(stored[0].completedAt).toBeDefined();

    // Verify recognized as completed in ActionPlanView
    const mockPlan: ActionPlan = {
      id: "plan-test-2",
      documentId: "doc-test-2",
      summary: "Test action plan",
      urgentItems: [],
      beforeSigning: [],
      questionsToAsk: [],
      documentsToCollect: [],
      factsToConfirm: [],
      professionalReviewTriggers: [],
      followUpItems: [],
      generatedAt: new Date().toISOString(),
    };

    const html = renderToString(
      React.createElement(ActionPlanView, {
        actionPlan: mockPlan,
      })
    );
    expect(html).toContain("Request 3-month probation cap");
    // Completed items receive line-through and 'incomplete' toggle aria-label
    expect(html).toContain("line-through");
    expect(html).toContain('aria-label="Mark &quot;Request 3-month probation cap&quot; as incomplete"');
    expect(html).toContain("completed");
  });

  // 7. Different comparison changes produce distinct stable IDs
  it("7. different comparison changes produce distinct stable IDs", () => {
    const pairs = matchClausesSemantically(DEMO_PREVIOUS_CLAUSES, DEMO_CURRENT_CLAUSES);
    const changes = analyzeAllClauseDifferences(pairs);

    const ids = changes.map((c) => c.suggestedActionItem.id);
    const uniqueIds = new Set(ids);

    expect(ids.length).toBeGreaterThan(1);
    expect(uniqueIds.size).toBe(ids.length);

    // All should follow pattern action-compare-<idx>-<slug>
    ids.forEach((id, idx) => {
      expect(id).toMatch(new RegExp(`^action-compare-${idx}-`));
    });
  });

  // 8. Removal reflects back to store and is recognized
  it("8. removing comparison item updates store and resets Compare button state", () => {
    const item: ActionPlanItem = {
      id: "action-compare-removable",
      title: "Test Removable Item",
      explanation: "Test explanation",
      actionType: "clarify",
      priority: "recommended",
      isReversible: true,
    };

    addCompareActionItem(item);
    expect(isCompareActionItemAdded(item.id, item.title)).toBe(true);

    removeCompareActionItem(item.id);
    expect(isCompareActionItemAdded(item.id, item.title)).toBe(false);
    expect(getCompareActionItems().length).toBe(0);

    const change = {
      ...FLAGSHIP_DEMO_COMPARISON.changes[0],
      suggestedActionItem: item,
    };

    const html = renderToString(
      React.createElement(SideBySideClauseView, {
        change,
        onAskLawPilot: () => {},
      })
    );
    expect(html).toContain("Add to Action Plan");
    expect(html).not.toContain("Saved to Action Plan");
  });
});
