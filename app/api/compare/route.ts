import { NextRequest, NextResponse } from "next/server";
import { FLAGSHIP_DEMO_COMPARISON } from "@/lib/demo/compareDemoData";
import {
  sanitizeFileName,
  MAX_FILE_SIZE_BYTES,
  DocumentInputError,
  isDeclaredContentLengthTooLarge,
} from "@/lib/documents/fileValidator";
import { checkRateLimit } from "@/lib/safety/rateLimiter";

// Allows for two files plus multipart boundaries/headers.
const MAX_REQUEST_BYTES = MAX_FILE_SIZE_BYTES * 2 + 64 * 1024;

export async function POST(req: NextRequest) {
  try {
    const rateLimit = checkRateLimit(req, "compare", 10, 60_000);
    if (rateLimit.limited) {
      return NextResponse.json(
        { success: false, error: "Too many requests. Please wait a moment before trying again." },
        { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } }
      );
    }

    const contentType = req.headers.get("content-type") || "";

    // 1. Demo Mode
    if (contentType.includes("application/json")) {
      let body: { isDemo?: boolean } = {};
      try {
        body = await req.json();
      } catch {
        return NextResponse.json(
          { success: false, error: "Invalid JSON request body." },
          { status: 400 }
        );
      }
      if (body.isDemo) {
        return NextResponse.json({
          success: true,
          comparison: FLAGSHIP_DEMO_COMPARISON,
        }, {
          headers: {
            // Demo payload is deterministic — safe to cache at CDN/browser level
            "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
          },
        });
      }
    }

    // 2. Multipart Form Upload (Dual Document Files)
    if (contentType.includes("multipart/form-data")) {
      // Reject early on a declared oversized body before it is fully buffered by formData().
      if (isDeclaredContentLengthTooLarge(req, MAX_REQUEST_BYTES)) {
        return NextResponse.json(
          {
            success: false,
            error: `One or more files exceed the maximum allowed size of ${MAX_FILE_SIZE_BYTES / (1024 * 1024)}MB.`,
          },
          { status: 413 }
        );
      }

      const formData = await req.formData();
      const previousFile = (formData.get("previousFile") || formData.get("fileA")) as File | null;
      const currentFile = (formData.get("currentFile") || formData.get("fileB")) as File | null;

      if (!previousFile || !currentFile) {
        return NextResponse.json(
          {
            success: false,
            error: "Both Previous Version and Current Version documents are required for comparison.",
          },
          { status: 400 }
        );
      }

      if (previousFile.size > MAX_FILE_SIZE_BYTES || currentFile.size > MAX_FILE_SIZE_BYTES) {
        return NextResponse.json(
          {
            success: false,
            error: `One or more files exceed the maximum allowed size of ${MAX_FILE_SIZE_BYTES / (1024 * 1024)}MB.`,
          },
          { status: 400 }
        );
      }

      if (previousFile.name === currentFile.name && previousFile.size === currentFile.size) {
        // Double check same file before parsing
        return NextResponse.json(
          {
            success: false,
            error: "The exact same file was selected for both Previous and Current versions. Please select two distinct drafts to compare.",
          },
          { status: 400 }
        );
      }

      const safePrevName = sanitizeFileName(previousFile.name);
      const safeCurrName = sanitizeFileName(currentFile.name);

      const prevArrayBuffer = await previousFile.arrayBuffer();
      const currArrayBuffer = await currentFile.arrayBuffer();

      const previousBuffer = Buffer.from(prevArrayBuffer);
      const currentBuffer = Buffer.from(currArrayBuffer);

      const { compareDocumentBuffers } = await import(
        "@/lib/comparison/documentComparator"
      );

      const comparison = await compareDocumentBuffers({
        previousBuffer,
        previousFileName: safePrevName,
        currentBuffer,
        currentFileName: safeCurrName,
      });

      return NextResponse.json({
        success: true,
        comparison,
      });
    }

    return NextResponse.json(
      {
        success: false,
        error: "Invalid comparison request. Please provide both document files via form data or request demo comparison.",
      },
      { status: 400 }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Document comparison failed.";
    // Known, expected input-validation failures (bad/empty/unsupported documents) are the
    // client's fault (400). Anything else is an unexpected server-side failure (500) — treating
    // every exception as 400 would hide real bugs and AI/provider outages from error monitoring.
    const isClientInputError = err instanceof DocumentInputError;
    return NextResponse.json(
      {
        success: false,
        error: isClientInputError
          ? message.slice(0, 300)
          : "Document comparison failed due to an unexpected server error. Please try again.",
      },
      { status: isClientInputError ? 400 : 500 }
    );
  }
}

// Live AI calls can take several seconds; the default serverless limit is too tight.
export const maxDuration = 60;
