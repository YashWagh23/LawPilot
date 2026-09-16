import type { Document } from "@/types";

/**
 * Client-side, localStorage-backed history of documents the user has actually analyzed in this
 * browser. LawPilot is zero-auth and local-first (see README "Local-First Privacy"): there is no
 * server-side database, so "recent activity" can only ever reflect this browser's own session.
 */

const STORAGE_KEY = "lawpilot_recent_documents_v1";
const MAX_ENTRIES = 8;

function isValidDocument(value: unknown): value is Document {
  if (!value || typeof value !== "object") return false;
  const d = value as Record<string, unknown>;
  return (
    typeof d.id === "string" &&
    typeof d.title === "string" &&
    typeof d.fileName === "string" &&
    typeof d.uploadedAt === "string" &&
    (d.status === "analyzed" || d.status === "uploaded" || d.status === "parsed" || d.status === "error")
  );
}

let lastRawSnapshot: string | null = null;
let lastParsedSnapshot: Document[] = [];

/**
 * Returns a referentially-stable snapshot (same array reference until the underlying storage
 * value actually changes) so this is safe to use directly as a useSyncExternalStore getSnapshot.
 */
export function getRecentDocumentsFromStorage(): Document[] {
  if (typeof window === "undefined") return lastParsedSnapshot;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw === lastRawSnapshot) return lastParsedSnapshot;
    lastRawSnapshot = raw;
    if (!raw) {
      lastParsedSnapshot = [];
      return lastParsedSnapshot;
    }
    const parsed = JSON.parse(raw);
    lastParsedSnapshot = Array.isArray(parsed) ? parsed.filter(isValidDocument) : [];
    return lastParsedSnapshot;
  } catch {
    lastParsedSnapshot = [];
    return lastParsedSnapshot;
  }
}

export function addRecentDocument(doc: Document): void {
  if (typeof window === "undefined") return;
  try {
    const existing = getRecentDocumentsFromStorage().filter((d) => d.id !== doc.id);
    const next = [doc, ...existing].slice(0, MAX_ENTRIES);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    window.dispatchEvent(new Event("lawpilot-recent-documents-updated"));
  } catch {
    // localStorage unavailable or quota exceeded — recent-activity tracking is best-effort only.
  }
}

/**
 * useSyncExternalStore-compatible subscribe function. Also listens for the native `storage` event
 * so a document analyzed in one tab shows up in another tab's already-open workspace view.
 */
export function subscribeToRecentDocuments(callback: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("storage", callback);
  window.addEventListener("lawpilot-recent-documents-updated", callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener("lawpilot-recent-documents-updated", callback);
  };
}
