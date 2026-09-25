import { NextRequest, NextResponse } from "next/server";
import {
  sanitizeFileName,
  MAX_FILE_SIZE_BYTES,
  DocumentInputError,
  isDeclaredContentLengthTooLarge,
} from "@/lib/documents/fileValidator";
import { SAMPLE_ANALYSIS_REPORT } from "@/lib/demo/sampleAnalysis";
import { saveCachedAnalysisReport } from "@/lib/storage/reportStore";
import { checkRateLimit } from "@/lib/safety/rateLimiter";

// Allows for one file plus multipart boundaries/headers and small non-file form fields
// (e.g. "role", "depth").
const MAX_REQUEST_BYTES = MAX_FILE_SIZE_BYTES + 64 * 1024;

export async function POST(req: NextRequest) {
  try {
    const rateLimit = checkRateLimit(req, "review-analyze", 10, 60_000);
    if (rateLimit.limited) {
      return NextResponse.json(
        { success: false, error: "Too many requests. Please wait a moment before trying again." },
        { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } }
      );
    }

    const contentType = req.headers.get("content-type") || "";

    // Case 1: Demo document analysis trigger (instant verified response)
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
        saveCachedAnalysisReport(SAMPLE_ANALYSIS_REPORT);
        return NextResponse.json(
          {
            success: true,
            reportId: SAMPLE_ANALYSIS_REPORT.id,
            report: SAMPLE_ANALYSIS_REPORT,
          },
          {
            headers: {
              // Demo payload is deterministic — safe to cache at CDN/browser level
              "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
            },
          }
        );
      }
    }

    // Case 2: Multipart form file upload
    if (contentType.includes("multipart/form-data")) {
      // Reject early on a declared oversized body before it is fully buffered by formData().
      if (isDeclaredContentLengthTooLarge(req, MAX_REQUEST_BYTES)) {
        return NextResponse.json(
          {
            success: false,
            error: `Uploaded file exceeds maximum allowed size of ${MAX_FILE_SIZE_BYTES / (1024 * 1024)}MB.`,
          },
          { status: 413 }
        );
      }

      const formData = await req.formData();
      const file = formData.get("file") as File | null;

      if (!file) {
        return NextResponse.json(
          { success: false, error: "No document file was provided in the upload." },
          { status: 400 }
        );
      }

      if (file.size > MAX_FILE_SIZE_BYTES) {
        return NextResponse.json(
          {
            success: false,
            error: `Uploaded file exceeds maximum allowed size of ${MAX_FILE_SIZE_BYTES / (1024 * 1024)}MB.`,
          },
          { status: 400 }
        );
      }

      const safeFileName = sanitizeFileName(file.name);
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const { orchestrateDocumentAnalysis } = await import(
        "@/lib/analysis/analysisOrchestrator"
      );

      const report = await orchestrateDocumentAnalysis(buffer, safeFileName);

      return NextResponse.json({
        success: true,
        reportId: report.id,
        report,
      });
    }

    return NextResponse.json(
      {
        success: false,
        error: "Invalid request. Please upload a file via multipart form data or request demo analysis.",
      },
      { status: 400 }
    );
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Failed to analyze document";
    // Known, expected input-validation failures (unsupported/corrupt/empty documents) are the
    // client's fault (400). Anything else is an unexpected server-side failure (500) — treating
    // every exception as 400 would hide real bugs and AI/provider outages from error monitoring.
    const isClientInputError = err instanceof DocumentInputError;
    return NextResponse.json(
      {
        success: false,
        error: isClientInputError
          ? errorMsg.slice(0, 300)
          : "Document analysis failed due to an unexpected server error. Please try again.",
      },
      { status: isClientInputError ? 400 : 500 }
    );
  }
}

// Live AI calls can take several seconds; the default serverless limit is too tight.
export const maxDuration = 60;
