import mammoth from "mammoth";
import { extractText } from "unpdf";
import type { SupportedFileType } from "./fileValidator";

export interface ExtractedPage {
  pageNumber: number;
  text: string;
}

export interface ExtractedDocumentContent {
  rawText: string;
  pages: ExtractedPage[];
  totalPageCount: number;
  wordCount: number;
  extractionWarnings: string[];
}

/**
 * Extracts raw text and page-by-page content from PDF, DOCX, or TXT buffers.
 */
export async function extractDocumentContent(
  buffer: Buffer,
  fileType: SupportedFileType
): Promise<ExtractedDocumentContent> {
  const extractionWarnings: string[] = [];

  if (fileType === "pdf") {
    try {
      const data = new Uint8Array(buffer);
      const result = await extractText(data);

      const pages: ExtractedPage[] = [];

      if (Array.isArray(result.text) && result.text.length > 0) {
        result.text.forEach((pageText, idx) => {
          pages.push({
            pageNumber: idx + 1,
            text: typeof pageText === "string" ? pageText : String(pageText || ""),
          });
        });
      } else {
        pages.push({
          pageNumber: 1,
          text: "",
        });
      }

      const rawText = pages.map((p) => p.text).join("\n\n");
      const wordCount = rawText.trim().split(/\s+/).filter(Boolean).length;

      return {
        rawText,
        pages,
        totalPageCount: Math.max(result.totalPages || pages.length, 1),
        wordCount,
        extractionWarnings,
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      throw new Error(`Failed to parse PDF content: ${msg}`);
    }
  }

  if (fileType === "docx") {
    try {
      const result = await mammoth.extractRawText({ buffer });
      const rawText = result.value || "";
      const wordCount = rawText.trim().split(/\s+/).filter(Boolean).length;

      if (result.messages && result.messages.length > 0) {
        extractionWarnings.push(...result.messages.map((m) => m.message));
      }

      // DOCX has fluid pagination, so page mapping is not natively fixed
      const pages: ExtractedPage[] = [
        {
          pageNumber: 1,
          text: rawText,
        },
      ];

      return {
        rawText,
        pages,
        totalPageCount: 1,
        wordCount,
        extractionWarnings,
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      throw new Error(`Failed to parse DOCX content: ${msg}`);
    }
  }

  // Plain Text (TXT)
  try {
    const rawText = buffer.toString("utf-8");
    const wordCount = rawText.trim().split(/\s+/).filter(Boolean).length;

    // Check for explicit page separators if any (\f)
    const splitPages = rawText.split(/\f/);
    const pages: ExtractedPage[] = splitPages.map((text, idx) => ({
      pageNumber: idx + 1,
      text,
    }));

    return {
      rawText,
      pages,
      totalPageCount: Math.max(pages.length, 1),
      wordCount,
      extractionWarnings,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(`Failed to decode text document: ${msg}`);
  }
}
