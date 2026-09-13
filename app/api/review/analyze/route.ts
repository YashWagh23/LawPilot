import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { orchestrateDocumentAnalysis } from "@/lib/analysis/analysisOrchestrator";
import { sanitizeFileName, MAX_FILE_SIZE_BYTES } from "@/lib/documents/fileValidator";

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") || "";

    // Case 1: Demo document analysis trigger
    if (contentType.includes("application/json")) {
      const body = await req.json();
      if (body.isDemo) {
        const demoPdfPath = path.resolve("./public/employment_agreement_demo.pdf");
        if (!fs.existsSync(demoPdfPath)) {
          return NextResponse.json(
            { success: false, error: "Demo PDF document not found on server." },
            { status: 404 }
          );
        }

        const buffer = fs.readFileSync(demoPdfPath);
        const report = await orchestrateDocumentAnalysis(
          buffer,
          "employment_agreement_demo.pdf"
        );

        return NextResponse.json({
          success: true,
          reportId: report.id,
          report,
        });
      }
    }

    // Case 2: Multipart form file upload
    if (contentType.includes("multipart/form-data")) {
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
    return NextResponse.json(
      {
        success: false,
        error: errorMsg.slice(0, 300),
      },
      { status: 400 }
    );
  }
}
