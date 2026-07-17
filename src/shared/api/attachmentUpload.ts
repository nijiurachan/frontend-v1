import { ApiError } from "./errors";

/** Mirrors backend-v1 DEFAULT_BOARD_CONFIG.limits.maxFileSizeBytes. */
export const MAX_ATTACHMENT_SIZE_BYTES: number = 20 * 1024 * 1024;

export async function readAttachmentWithinLimit(
  file: Pick<File, "arrayBuffer" | "size">,
): Promise<ArrayBuffer> {
  if (file.size > MAX_ATTACHMENT_SIZE_BYTES) {
    throw new ApiError(
      "添付ファイルは20MB以下にしてください",
      undefined,
      "ATTACHMENT_TOO_LARGE",
    );
  }
  return file.arrayBuffer();
}
