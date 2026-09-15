import type { ActionPlanItem } from "@/types";

export const COMPARE_ACTIONS_KEY = "lawpilot_compare_action_items";
export const COMPARE_ACTION_EVENT = "lawpilot_compare_action_updated";

/**
 * Safely dispatches a custom event when in browser environment
 */
function notifyCompareStoreUpdated(detail?: Record<string, unknown>) {
  if (typeof window !== "undefined" && typeof window.dispatchEvent === "function") {
    try {
      window.dispatchEvent(
        new CustomEvent(COMPARE_ACTION_EVENT, { detail })
      );
    } catch {
      // Ignore event dispatch errors in restricted environments
    }
  }
}

/**
 * Retrieves all action items added from document comparisons
 */
export function getCompareActionItems(): ActionPlanItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(COMPARE_ACTIONS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Checks if a specific action item has already been added (by ID or title)
 */
export function isCompareActionItemAdded(itemId?: string, itemTitle?: string): boolean {
  if (!itemId && !itemTitle) return false;
  const items = getCompareActionItems();
  const normalizedTitle = itemTitle?.trim().toLowerCase();
  return items.some(
    (item) =>
      (itemId && item.id === itemId) ||
      (normalizedTitle && item.title?.trim().toLowerCase() === normalizedTitle)
  );
}

/**
 * Adds an action item from a comparison card to the persistent store.
 * Returns true if added, false if already present or storage failed.
 */
export function addCompareActionItem(item: ActionPlanItem): boolean {
  if (typeof window === "undefined") return false;
  try {
    const items = getCompareActionItems();
    const normalizedTitle = item.title?.trim().toLowerCase();
    if (
      items.some(
        (i) =>
          i.id === item.id ||
          (normalizedTitle && i.title?.trim().toLowerCase() === normalizedTitle)
      )
    ) {
      return false; // Already present
    }
    items.unshift(item);
    localStorage.setItem(COMPARE_ACTIONS_KEY, JSON.stringify(items));
    notifyCompareStoreUpdated({ action: "add", itemId: item.id });
    return true;
  } catch {
    return false;
  }
}

/**
 * Removes an action item from the store (reversibility)
 */
export function removeCompareActionItem(itemId: string): void {
  if (typeof window === "undefined") return;
  try {
    const items = getCompareActionItems().filter((item) => item.id !== itemId);
    localStorage.setItem(COMPARE_ACTIONS_KEY, JSON.stringify(items));
    notifyCompareStoreUpdated({ action: "remove", itemId });
  } catch {
    // Ignore storage errors
  }
}

/**
 * Toggles or sets the completed state of a comparison action item in persistent storage
 */
export function toggleCompareActionItemCompleted(itemId: string, completed?: boolean): boolean {
  if (typeof window === "undefined") return false;
  try {
    const items = getCompareActionItems();
    const target = items.find((i) => i.id === itemId);
    if (!target) return false;

    target.completed = completed !== undefined ? completed : !target.completed;
    if (target.completed) {
      target.completedAt = new Date().toISOString();
    } else {
      delete target.completedAt;
    }

    localStorage.setItem(COMPARE_ACTIONS_KEY, JSON.stringify(items));
    notifyCompareStoreUpdated({ action: "toggle", itemId, completed: target.completed });
    return true;
  } catch {
    return false;
  }
}
