/**
 * Firebase Storage Service Layer
 * Manages document binary uploads, access permissions, and temporary download URLs.
 */

export interface UploadDocumentResult {
  storagePath: string;
  downloadUrl?: string;
  fileSizeBytes: number;
}

export async function uploadDocumentFile(
  file: File,
  userId: string
): Promise<UploadDocumentResult> {
  // Production implementation connects to ref(storage, `users/${userId}/documents/${file.name}`)
  return {
    storagePath: `users/${userId}/documents/${file.name}`,
    fileSizeBytes: file.size,
  };
}
