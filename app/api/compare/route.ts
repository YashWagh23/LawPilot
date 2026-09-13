import { NextRequest, NextResponse } from "next/server";
import { FLAGSHIP_DEMO_COMPARISON } from "@/lib/demo/compareDemoData";
import { compareDocumentBuffers } from "@/lib/comparison/documentComparator";

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") || "";

    // 1. Demo Mode
    if (contentType.includes("application/json")) {
      const body = await req.json();
      if (body.isDemo) {
        return NextResponse.json({
          success: true,
          comparison: FLAGSHIP_DEMO_COMPARISON,
        });
      }
    }

    // 2. Multipart Form Upload (Dual Document Files)
    if (contentType.includes("multipart/form-data")) {
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

      const prevArrayBuffer = await previousFile.arrayBuffer();
      const currArrayBuffer = await currentFile.arrayBuffer();

      const previousBuffer = Buffer.from(prevArrayBuffer);
      const currentBuffer = Buffer.from(currArrayBuffer);

      const comparison = await compareDocumentBuffers({
        previousBuffer,
        previousFileName: previousFile.name,
        currentBuffer,
        currentFileName: currentFile.name,
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
    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status: 400 }
    );
  }
}
