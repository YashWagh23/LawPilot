/**
 * File Validation & Security Verification
 * Enforces file size limits, MIME type verification, magic byte checks,
 * and filename sanitization against path traversal attacks.
 */

export const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024; // 15 MB

/**
 * Rejects a request based on its declared `Content-Length` header before the body is read into
 * memory (e.g. before `request.formData()`), when the header is present and honest. This does not
 * stop a client that lies about Content-Length — the Node.js runtime on Vercel still has to read
 * whatever bytes actually arrive — but it avoids unnecessarily buffering an entire oversized body
 * for the (much more common) case of a legitimate/well-behaved client, and gives a fast, cheap
 * rejection before any multipart parsing work begins.
 */
export function isDeclaredContentLengthTooLarge(
  request: { headers: { get(name: string): string | null } },
  maxTotalBytes: number
): boolean {
  const declared = request.headers.get("content-length");
  if (!declared) return false;
  const declaredBytes = Number(declared);
  if (!Number.isFinite(declaredBytes) || declaredBytes < 0) return false;
  return declaredBytes > maxTotalBytes;
}

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
 * Marks an error as a known, expected client-input problem (bad/empty/unsupported/corrupt
 * document) rather than an unexpected server-side failure. API routes use this distinction to
 * return the correct HTTP status code (400 vs 500) instead of treating every exception as a
 * client error.
 */
export class DocumentInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DocumentInputError";
  }
}

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

  // TXT check: the sample must be free of null bytes AND decode as text with a high ratio of
  // printable/whitespace characters. A null-byte-only check lets many binary formats (which
  // happen to have no 0x00 in their first bytes) masquerade as "text" and flow into the analysis
  // pipeline as garbage; requiring mostly-printable content rejects that class of file.
  const sampleLength = Math.min(buffer.length, 2048);
  const sample = buffer.subarray(0, sampleLength);

  let hasNull = false;
  let printableOrWhitespaceCount = 0;
  for (let i = 0; i < sample.length; i++) {
    const byte = sample[i];
    if (byte === 0x00) {
      hasNull = true;
      break;
    }
    // Printable ASCII (0x20-0x7E), or common whitespace (tab, LF, CR), or high bytes that are
    // plausibly part of a valid UTF-8 multi-byte sequence (extended Latin/Unicode text).
    if (
      (byte >= 0x20 && byte <= 0x7e) ||
      byte === 0x09 ||
      byte === 0x0a ||
      byte === 0x0d ||
      byte >= 0x80
    ) {
      printableOrWhitespaceCount++;
    }
  }

  if (hasNull || sample.length === 0) {
    return null;
  }

  const printableRatio = printableOrWhitespaceCount / sample.length;
  if (printableRatio < 0.95) {
    return null;
  }

  return "txt";
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
