import noImage from "@/assets/img/no-image.svg";
import type { Attachment } from "@/entities/attachment";
import type { Post } from "@/entities/post";
import type { ThreadSummary, ThreadView } from "@/entities/thread/types";
import { UPLOADS_BASE } from "@/shared/api";
import { decodeHtmlEntities } from "@/shared/lib";

type ThreadWithOp = Pick<ThreadSummary, "opPost"> | Pick<ThreadView, "posts">;

export function getThreadOp(thread: ThreadWithOp): Post | null {
  if ("opPost" in thread) return thread.opPost;
  return thread.posts[0] ?? null;
}

export function getThreadTitle(
  thread: ThreadWithOp,
  maxLength: number = 30,
): string {
  const body = getThreadOp(thread)?.body.trim() ?? "";
  return decodeHtmlEntities(body).slice(0, maxLength) || "(無題)";
}

export function resolveUploadPath(path: string): string {
  if (!path) return noImage;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  if (path.startsWith("/uploads/")) {
    return `${UPLOADS_BASE}${path.slice("/uploads".length)}`;
  }
  if (path.startsWith("uploads/")) {
    return `${UPLOADS_BASE}/${path.slice("uploads/".length)}`;
  }
  return path.startsWith("/") ? path : `/${path}`;
}

export function getImageUrl(
  attachment: Attachment | null | undefined,
  preferOriginal: boolean,
): string {
  if (!attachment) return noImage;
  return resolveUploadPath(
    preferOriginal ? attachment.originalUrl : attachment.thumbnailUrl,
  );
}
