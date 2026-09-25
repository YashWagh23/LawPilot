import { useSyncExternalStore } from "react";
import type { NegotiationDraft } from "@/types";

/**
 * Local-first store for negotiation drafts the user chose to keep, scoped per document.
 * The Action Plan and Lawyer Brief both read from here, so saving a draft once surfaces it in
 * both places. Mirrors compareActionStore's storage + custom-event pattern.
 */

export const NEGOTIATION_STORE_PREFIX = "lawpilot_negotiation_drafts_";
export const NEGOTIATION_STORE_EVENT = "lawpilot_negotiation_updated";

const EMPTY: NegotiationDraft[] = [];

function storageKey(documentId: string): string {
  return `${NEGOTIATION_STORE_PREFIX}${documentId}`;
}

function notify(documentId: string) {
  if (typeof window === "undefined" || typeof window.dispatchEvent !== "function") return;
  try {
    window.dispatchEvent(new CustomEvent(NEGOTIATION_STORE_EVENT, { detail: { documentId } }));
  } catch {
    // Ignore event dispatch errors in restricted environments
  }
}

function readRaw(documentId: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(storageKey(documentId));
  } catch {
    return null;
  }
}

function parse(raw: string | null): NegotiationDraft[] {
  if (!raw) return EMPTY;
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : EMPTY;
  } catch {
    return EMPTY;
  }
}

export function getSavedNegotiationDrafts(documentId: string): NegotiationDraft[] {
  return parse(readRaw(documentId));
}

export function isNegotiationDraftSaved(documentId: string, findingId: string): boolean {
  return getSavedNegotiationDrafts(documentId).some((d) => d.findingId === findingId);
}

/** Saves (or replaces) the draft for its finding. Returns false if storage is unavailable. */
export function saveNegotiationDraft(draft: NegotiationDraft): boolean {
  if (typeof window === "undefined") return false;
  try {
    const others = getSavedNegotiationDrafts(draft.documentId).filter((d) => d.findingId !== draft.findingId);
    localStorage.setItem(storageKey(draft.documentId), JSON.stringify([draft, ...others]));
    notify(draft.documentId);
    return true;
  } catch {
    return false;
  }
}

export function removeNegotiationDraft(documentId: string, findingId: string): void {
  if (typeof window === "undefined") return;
  try {
    const remaining = getSavedNegotiationDrafts(documentId).filter((d) => d.findingId !== findingId);
    localStorage.setItem(storageKey(documentId), JSON.stringify(remaining));
    notify(documentId);
  } catch {
    // Ignore storage errors
  }
}

// ─── React binding ────────────────────────────────────────────────────────

// Snapshot cache so useSyncExternalStore gets a stable reference while the raw value is unchanged.
const snapshotCache = new Map<string, { raw: string | null; value: NegotiationDraft[] }>();

function getSnapshot(documentId: string): NegotiationDraft[] {
  const raw = readRaw(documentId);
  const cached = snapshotCache.get(documentId);
  if (cached && cached.raw === raw) return cached.value;
  const value = parse(raw);
  snapshotCache.set(documentId, { raw, value });
  return value;
}

function subscribe(onChange: () => void): () => void {
  window.addEventListener(NEGOTIATION_STORE_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(NEGOTIATION_STORE_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

/** Saved negotiation drafts for a document; empty during SSR and on first hydration pass. */
export function useSavedNegotiationDrafts(documentId: string | undefined): NegotiationDraft[] {
  return useSyncExternalStore(
    subscribe,
    () => (documentId ? getSnapshot(documentId) : EMPTY),
    () => EMPTY
  );
}
