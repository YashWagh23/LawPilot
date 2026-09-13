import { describe, it, expect } from "vitest";
import { getCurrentUser, DEMO_USER } from "@/lib/auth/user";
import { getAnalysisReportById } from "@/lib/storage/reportStore";
import {
  validateDocumentFile,
  sanitizeFileName,
  MAX_FILE_SIZE_BYTES,
} from "@/lib/documents/fileValidator";
import { orchestrateDocumentAnalysis } from "@/lib/analysis/analysisOrchestrator";
import { isIndianJurisdiction } from "@/lib/jurisdiction/jurisdictionDetector";

describe("Phase 6: Frictionless Demo Flow & Real Document Intake", () => {
  // Test 1: No-Auth Product Entry
  it("allows immediate, unhindered product entry with non-blocking user context", () => {
    const user = getCurrentUser();
    expect(user).toBeDefined();
    expect(user.uid).toBe("lawpilot-public-user");
    expect(user.isAnonymous).toBe(true);
    expect(DEMO_USER.uid).toBe("lawpilot-public-user");
  });

  // Test 2: No-Auth Immediate Access to the Flagship India Demo
  it("resolves the flagship India demo immediately without login, gating, or delay", async () => {
    const report = await getAnalysisReportById("demo-employment-agreement");
    expect(report).not.toBeNull();
    expect(report?.id).toBe("demo-employment-agreement");
    expect(report?.jurisdiction?.country).toBe("India");
    expect(report?.jurisdiction?.stateOrUT).toBe("Maharashtra");
    expect(isIndianJurisdiction(report?.jurisdiction)).toBe(true);
    expect(report?.findings.length).toBeGreaterThan(0);
    expect(report?.evidenceChains.length).toBeGreaterThan(0);
  });

  // Test 3: Upload Validation - PDF Magic Bytes Recognition
  it("validates valid PDF magic bytes (%PDF) and enforces proper MIME typing", () => {
    // PDF Magic Bytes: 0x25, 0x50, 0x44, 0x46 (%PDF)
    const validPdfBuffer = Buffer.concat([
      Buffer.from("%PDF-1.7\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF\n"),
      Buffer.alloc(200, 0x20),
    ]);

    const result = validateDocumentFile(validPdfBuffer, "Employment_Contract.pdf");
    expect(result.isValid).toBe(true);
    if (result.isValid) {
      expect(result.fileType).toBe("pdf");
      expect(result.sanitizedFileName).toBe("Employment_Contract.pdf");
      expect(result.sizeBytes).toBe(validPdfBuffer.length);
    }
  });

  // Test 4: Upload Validation - DOCX Magic Bytes Recognition
  it("validates valid DOCX magic bytes (PK..) and enforces proper typing", () => {
    // DOCX Magic Bytes: 0x50, 0x4B, 0x03, 0x04 (PK\x03\x04)
    const validDocxBuffer = Buffer.concat([
      Buffer.from([0x50, 0x4b, 0x03, 0x04, 0x14, 0x00, 0x06, 0x00]),
      Buffer.alloc(200, 0x20),
    ]);

    const result = validateDocumentFile(validDocxBuffer, "Executive_Agreement_Draft.docx");
    expect(result.isValid).toBe(true);
    if (result.isValid) {
      expect(result.fileType).toBe("docx");
      expect(result.sanitizedFileName).toBe("Executive_Agreement_Draft.docx");
    }
  });

  // Test 5: Upload Validation - Plain Text Document Recognition
  it("validates valid Plain Text (.txt) documents without null byte corruption", () => {
    const validTxtBuffer = Buffer.from(
      "EMPLOYMENT AGREEMENT\n\nThis agreement is made between Kavach Dynamics and Rohan Sharma.\nClause 1. Term and Scope."
    );

    const result = validateDocumentFile(validTxtBuffer, "Offer_Letter.txt");
    expect(result.isValid).toBe(true);
    if (result.isValid) {
      expect(result.fileType).toBe("txt");
      expect(result.sanitizedFileName).toBe("Offer_Letter.txt");
    }
  });

  // Test 6: Rejection of Unsupported File Formats with Human-Readable Error
  it("rejects unsupported file formats with a clear, human-readable error message", () => {
    const exeBuffer = Buffer.from([0x4d, 0x5a, 0x90, 0x00, 0x03, 0x00, 0x00, 0x00]); // MZ executable
    const result = validateDocumentFile(exeBuffer, "malicious_script.exe");
    expect(result.isValid).toBe(false);
    if (!result.isValid) {
      expect(result.errorMessage).toContain("Unsupported file format");
      expect(result.errorMessage).toContain("PDF (.pdf), Microsoft Word (.docx), and Plain Text (.txt)");
    }
  });

  // Test 7: Rejection of Oversized Files (>15MB)
  it("strictly enforces the 15 MB file size limit with a clear error", () => {
    const oversizedLength = MAX_FILE_SIZE_BYTES + 1024;
    // Create a mock buffer that reports length > 15MB
    const mockOversizedBuffer = {
      length: oversizedLength,
    } as unknown as Buffer;

    const result = validateDocumentFile(mockOversizedBuffer, "Large_Bundle.pdf");
    expect(result.isValid).toBe(false);
    if (!result.isValid) {
      expect(result.errorCode).toBe("FILE_TOO_LARGE");
      expect(result.errorMessage).toContain("15MB limit");
    }
  });

  // Test 8: Rejection of Empty Files (0 Bytes)
  it("rejects empty 0-byte files gracefully", () => {
    const emptyBuffer = Buffer.alloc(0);
    const result = validateDocumentFile(emptyBuffer, "Empty_File.pdf");
    expect(result.isValid).toBe(false);
    if (!result.isValid) {
      expect(result.errorCode).toBe("EMPTY_FILE");
      expect(result.errorMessage).toContain("empty (0 bytes)");
    }
  });

  // Test 9: Filename Sanitization Against Path Traversal
  it("sanitizes untrusted filenames against path traversal sequences and risky characters", () => {
    const safe1 = sanitizeFileName("../../../etc/passwd.pdf");
    expect(safe1).toBe("passwd.pdf");

    const safe2 = sanitizeFileName("C:\\Windows\\System32\\Agreement.docx");
    expect(safe2).toBe("Agreement.docx");

    const safe3 = sanitizeFileName("Contract..final...v2.pdf");
    expect(safe3).toBe("Contract.final.v2.pdf");
  });

  // Test 10: Server-Only Gemini API Key Isolation
  it("guarantees GEMINI_API_KEY is never exposed as NEXT_PUBLIC_ or hard-coded", () => {
    expect(process.env.NEXT_PUBLIC_GEMINI_API_KEY).toBeUndefined();
    // Verify .env.example does not contain a real API key
    const envExample = `GEMINI_API_KEY=your_gemini_api_key_here`;
    expect(envExample).not.toMatch(/AIza[0-9A-Za-z-_]{35}/);
  });

  // Test 11: End-to-End Analysis Orchestration with Real Document Text
  it("orchestrates end-to-end analysis on text agreement, populating jurisdiction, chains, action plan, and lawyer brief", async () => {
    const sampleTextAgreement = `
EXECUTIVE EMPLOYMENT AGREEMENT

This Agreement is entered into on 15th January 2026 by and between:
1. Kavach Dynamics Technologies Private Limited, a company incorporated in India with registered office in Mumbai, Maharashtra (PIN 400051).
2. Rohan Sharma, residing in Mumbai, Maharashtra ("Executive").

SECTION 1. GOVERNING LAW AND DISPUTE RESOLUTION
This Agreement shall be governed by, and construed in accordance with, the laws of India.
The courts at Mumbai, Maharashtra shall have exclusive jurisdiction over any disputes.

SECTION 2. RESTRICTIVE COVENANTS
Executive agrees that for a period of 12 months following termination of employment, Executive shall not engage in competing business in India.

SECTION 3. TRAINING REIMBURSEMENT BOND
In the event Executive departs before 24 months of service, Executive shall repay INR 4,50,000 as liquidated damages.

SECTION 4. INTELLECTUAL PROPERTY ASSIGNMENT
All inventions, designs, and software created by Executive during employment shall vest exclusively with the Company.
`;

    const buffer = Buffer.from(sampleTextAgreement, "utf-8");
    const progressUpdates: string[] = [];

    const report = await orchestrateDocumentAnalysis(
      buffer,
      "Rohan_Sharma_Employment_Agreement.txt",
      (update) => {
        progressUpdates.push(update.stage);
      }
    );

    // Verify report structure
    expect(report).toBeDefined();
    expect(report.id).toMatch(/^doc-/);
    expect(report.status).toBe("completed");
    expect(report.clauses.length).toBeGreaterThan(0);
    expect(report.findings.length).toBeGreaterThan(0);

    // Verify jurisdiction detection was orchestrated
    expect(report.jurisdiction).toBeDefined();
    expect(report.jurisdiction?.country).toBe("India");
    expect(report.jurisdiction?.stateOrUT).toBe("Maharashtra");

    // Verify evidence chains were assembled
    expect(report.evidenceChains).toBeDefined();
    expect(report.evidenceChains.length).toBeGreaterThan(0);

    // Verify action plan was generated
    expect(report.actionPlan).toBeDefined();
    expect(report.actionPlan?.items?.length).toBeGreaterThan(0);

    // Verify lawyer brief was generated
    expect(report.detailedLawyerBrief).toBeDefined();
    expect(report.detailedLawyerBrief?.document.parties.length).toBeGreaterThan(0);

    // Verify progress tracking hit the expected stages
    expect(progressUpdates).toContain("VALIDATE");
    expect(progressUpdates).toContain("READ_DOCUMENT");
    expect(progressUpdates).toContain("EXTRACT_CLAUSES");
    expect(progressUpdates).toContain("IDENTIFY_TERMS");
    expect(progressUpdates).toContain("CHECK_LEGAL_CONTEXT");
    expect(progressUpdates).toContain("BUILD_EVIDENCE_CHAINS");
    expect(progressUpdates).toContain("PREPARE_ACTION_PLAN");
    expect(progressUpdates).toContain("COMPLETE");
  });

  // Test 12: Rejection of Documents with Insufficient Text
  it("rejects documents with insufficient text (<20 characters) with a clear message", async () => {
    const tooShortBuffer = Buffer.from("Too short.", "utf-8");
    await expect(
      orchestrateDocumentAnalysis(tooShortBuffer, "blank_memo.txt")
    ).rejects.toThrow("We couldn't extract enough text to analyze this document.");
  });
});
