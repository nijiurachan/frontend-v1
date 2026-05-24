/**
 * メディアタイプ判定ユーティリティ
 */

/**
 * ファイルが動画かどうかを判定する
 */
export function isVideoFile(filename: string, mimeType?: string): boolean {
  // MIMEタイプでの判定
  if (mimeType?.startsWith("video/")) {
    return true;
  }

  // 拡張子での判定
  const ext = filename.split(".").pop()?.toLowerCase();
  const videoExtensions = [
    "mp4",
    "webm",
    "mov",
    "avi",
    "mkv",
    "flv",
    "wmv",
    "m4v",
  ];
  return videoExtensions.includes(ext || "");
}

/**
 * Attachmentが動画かどうかを判定する
 */
export function isVideoAttachment(attachment: {
  path: string;
  mime_type: string;
}): boolean {
  return isVideoFile(attachment.path, attachment.mime_type);
}
