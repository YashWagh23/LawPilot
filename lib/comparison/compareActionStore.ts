import type { ActionPlanItem } from "@/types";

const COMPARE_ACTIONS_KEY = "lawpilot_compare_action_items";

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
 * Checks if a specific action item has already been added
 */
export function isCompareActionItemAdded(itemId: string): boolean {
  const items = getCompareActionItems();
  return items.some((item) => item.id === itemId);
}

/**
 * Adds an action item from a comparison card to the persistent store
 */
export function addCompareActionItem(item: ActionPlanItem): boolean {
  if (typeof window === "undefined") return false;
  try {
    const items = getCompareActionItems();
    if (items.some((i) => i.id === item.id || i.title === item.title)) {
      return false; // Already present
    }
    items.unshift(item);
    localStorage.setItem(COMPARE_ACTIONS_KEY, JSON.stringify(items));
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
  } catch {
    // Ignore storage errors
  }
}
