import { sanitizeDocumentForAgent } from "@/lib/safety/documentSanitizer";
import type { ExtractedPage } from "./textExtractor";

export interface NormalizedDocument {
  normalizedFullText: string;
  normalizedPages: ExtractedPage[];
  isolatedContent: string;
  detectedSuspiciousPatterns: string[];
  originalLength: number;
  normalizedLength: number;
}

/**
 * Normalizes text formatting across documents while preserving paragraph structure
 * and isolating content inside an untrusted data boundary.
 */
export function normalizeDocumentContent(
  rawText: string,
  pages: ExtractedPage[]
): NormalizedDocument {
  // Normalize line endings
  let text = rawText.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  // Remove null characters and control codes except newline and tab
  text = text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");

  // Normalize excessive horizontal whitespace per line
  text = text
    .split("\n")
    .map((line) => line.replace(/[ \t]+/g, " ").trim())
    .join("\n");

  // Collapse 3 or more newlines into 2
  text = text.replace(/\n{3,}/g, "\n\n").trim();

  // Normalize each page's text similarly
  const normalizedPages = pages.map((p) => {
    let pText = p.text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
    pText = pText.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");
    pText = pText
      .split("\n")
      .map((l) => l.replace(/[ \t]+/g, " ").trim())
      .join("\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim();

    return {
      pageNumber: p.pageNumber,
      text: pText,
    };
  });

  // Isolate and check for prompt injection
  const { isolatedContent, detectedSuspiciousPatterns } =
    sanitizeDocumentForAgent(text);

  return {
    normalizedFullText: text,
    normalizedPages,
    isolatedContent,
    detectedSuspiciousPatterns,
    originalLength: rawText.length,
    normalizedLength: text.length,
  };
}
