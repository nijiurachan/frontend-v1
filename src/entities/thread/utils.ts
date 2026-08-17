import noImage from "@/assets/img/no-image.svg";
import type { Attachment } from "@/entities/attachment";
import { UPLOADS_BASE } from "@/shared/api";
import { decodeHtmlEntities } from "@/shared/lib";
import type { Thread } from "./types";

export function getThreadTitle(
  thread: Pick<Thread, "title" | "body">,
  maxLength: number = 30,
): string {
  if (thread.title) return decodeHtmlEntities(thread.title);
  const stripped = thread.body.replace(/<[^>]+>/g, "").trim();
  return decodeHtmlEntities(stripped).slice(0, maxLength) || "(無題)";
}

export function resolveUploadPath(path: string): string {
  if (!path) return noImage;

  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }

  if (path.startsWith("/uploads/")) {
    return `${UPLOADS_BASE}${path.slice("/uploads".length)}`;
  }

  // uploads/ で始まる場合
  if (path.startsWith("uploads/")) {
    return `${UPLOADS_BASE}/${path.slice("uploads/".length)}`;
  }

  // それ以外はそのまま
  return path.startsWith("/") ? path : `/${path}`;
}

/**
 * Attachment型から画像URLを取得する共通ヘルパー関数
 * @param attachment - 画像のAttachmentオブジェクト
 * @param preferOriginal - trueの場合はオリジナル画像、falseの場合はサムネイルを優先
 * @returns 画像のURL（存在しない場合はno-imageを返す）
 */
export function getImageUrl(
  attachment: Attachment | null | undefined,
  preferOriginal: boolean,
): string {
  if (!attachment) return noImage;
  const path = preferOriginal
    ? attachment.path
    : attachment.thumbnail || attachment.path;
  return resolveUploadPath(path);
}
