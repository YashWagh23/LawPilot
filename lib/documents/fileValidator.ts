/**
 * File Validation & Security Verification
 * Enforces file size limits, MIME type verification, magic byte checks,
 * and filename sanitization against path traversal attacks.
 */

export const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024; // 15 MB

export type SupportedFileType = "pdf" | "docx" | "txt";

export interface ValidationSuccess {
  isValid: true;
  fileType: SupportedFileType;
  sanitizedFileName: string;
  sizeBytes: number;
}

export interface ValidationFailure {
  isValid: false;
  errorCode:
    | "EMPTY_FILE"
    | "FILE_TOO_LARGE"
    | "UNSUPPORTED_TYPE"
    | "CORRUPT_OR_INVALID_SIGNATURE"
    | "INVALID_FILENAME";
  errorMessage: string;
}

export type FileValidationResult = ValidationSuccess | ValidationFailure;

/**
 * Sanitizes an untrusted filename, stripping directory traversal sequences,
 * absolute paths, and risky control characters.
 */
export function sanitizeFileName(rawName: string): string {
  if (!rawName || typeof rawName !== "string") {
    return "document_upload.txt";
  }

  // Strip path traversal attempts and separators
  let baseName = rawName.replace(/^.*[\\/]/, "");
  // Remove null bytes and non-printable characters
  baseName = baseName.replace(/[\0-\x1F\x7F]/g, "");
  // Replace multiple periods (prevent double extension spoofing) except the last one
  baseName = baseName.replace(/\.{2,}/g, ".");
  // Restrict to safe legal document characters: alphanumeric, dash, underscore, space, dot
  baseName = baseName.replace(/[^a-zA-Z0-9_\-\.\s]/g, "_").trim();

  if (!baseName || baseName === ".") {
    return "document_upload.txt";
  }

  // Maximum 120 chars
  return baseName.slice(0, 120);
}

/**
 * Checks magic byte signatures to prevent file extension spoofing
 */
function verifyMagicBytes(buffer: Buffer): SupportedFileType | null {
  if (buffer.length < 4) return null;

  // PDF signature: %PDF (0x25, 0x50, 0x44, 0x46)
  if (
    buffer[0] === 0x25 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x44 &&
    buffer[3] === 0x46
  ) {
    return "pdf";
  }

  // DOCX signature: PK.. (ZIP container) 0x50, 0x4B, 0x03, 0x04
  if (
    buffer[0] === 0x50 &&
    buffer[1] === 0x4b &&
    buffer[2] === 0x03 &&
    buffer[3] === 0x04
  ) {
    return "docx";
  }

  // TXT check: inspect first 512 bytes for absence of null bytes
  const sampleLength = Math.min(buffer.length, 512);
  let hasNull = false;
  for (let i = 0; i < sampleLength; i++) {
    if (buffer[i] === 0x00) {
      hasNull = true;
      break;
    }
  }

  if (!hasNull) {
    return "txt";
  }

  return null;
}

/**
 * Validates an uploaded document buffer and filename
 */
export function validateDocumentFile(
  buffer: Buffer,
  fileName: string
): FileValidationResult {
  if (!buffer || buffer.length === 0) {
    return {
      isValid: false,
      errorCode: "EMPTY_FILE",
      errorMessage: "Uploaded file is empty (0 bytes). Please upload a valid document.",
    };
  }

  if (buffer.length > MAX_FILE_SIZE_BYTES) {
    return {
      isValid: false,
      errorCode: "FILE_TOO_LARGE",
      errorMessage: `File size exceeds the 15MB limit (${(buffer.length / 1024 / 1024).toFixed(1)}MB). Please upload a smaller file.`,
    };
  }

  const sanitizedFileName = sanitizeFileName(fileName);
  const detectedType = verifyMagicBytes(buffer);

  if (!detectedType) {
    return {
      isValid: false,
      errorCode: "UNSUPPORTED_TYPE",
      errorMessage:
        "Unsupported file format. LawPilot supports PDF (.pdf), Microsoft Word (.docx), and Plain Text (.txt) documents.",
    };
  }

  // Match extension against detected signature to prevent file extension spoofing
  const lowerName = sanitizedFileName.toLowerCase();
  if (lowerName.endsWith(".pdf") && detectedType !== "pdf") {
    return {
      isValid: false,
      errorCode: "UNSUPPORTED_TYPE",
      errorMessage: "File has a .pdf extension but lacks valid PDF magic bytes (%PDF).",
    };
  }
  if (lowerName.endsWith(".docx") && detectedType !== "docx") {
    return {
      isValid: false,
      errorCode: "UNSUPPORTED_TYPE",
      errorMessage: "File has a .docx extension but lacks valid DOCX magic bytes.",
    };
  }
  if (
    detectedType === "txt" &&
    (lowerName.endsWith(".exe") ||
      lowerName.endsWith(".bin") ||
      lowerName.endsWith(".png") ||
      lowerName.endsWith(".jpg") ||
      lowerName.endsWith(".jpeg") ||
      lowerName.endsWith(".gif") ||
      lowerName.endsWith(".zip") ||
      lowerName.endsWith(".tar") ||
      lowerName.endsWith(".sh") ||
      lowerName.endsWith(".bat"))
  ) {
    return {
      isValid: false,
      errorCode: "UNSUPPORTED_TYPE",
      errorMessage: "Executable, archive, and image files are not supported.",
    };
  }

  return {
    isValid: true,
    fileType: detectedType,
    sanitizedFileName,
    sizeBytes: buffer.length,
  };
}
