import { ApiError } from "@/shared/api/errors";

/** Mirrors backend-v1 DEFAULT_BOARD_CONFIG.limits.maxFileSizeBytes. */
export const DEFAULT_MAX_ATTACHMENT_BYTES: number = 20 * 1024 * 1024;

/** Build-time client-side guard; the presign API remains the final authority. */
export const MAX_ATTACHMENT_BYTES: number = maxAttachmentBytesFromEnv(
  import.meta.env.VITE_MAX_ATTACHMENT_BYTES,
);

function maxAttachmentBytesFromEnv(value: string | undefined): number {
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0
    ? parsed
    : DEFAULT_MAX_ATTACHMENT_BYTES;
}

/**
 * 添付ファイルをMD5計算用に読み込む。
 * サイズ超過はArrayBuffer化より前に拒否し、presign側の検査も残す。
 */
export async function readAttachmentForUpload(
  file: Pick<File, "arrayBuffer" | "size">,
): Promise<ArrayBuffer> {
  if (file.size > MAX_ATTACHMENT_BYTES) {
    throw new ApiError(
      `添付ファイルは${MAX_ATTACHMENT_BYTES}バイト以下にしてください`,
      undefined,
      "ATTACHMENT_TOO_LARGE",
    );
  }
  return file.arrayBuffer();
}
