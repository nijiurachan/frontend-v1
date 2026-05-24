import type { Attachment } from "@/entities/attachment";
import type { Post } from "@/entities/post";
import { resolveUploadPath } from "@/entities/thread";
import { isVideoAttachment } from "@/shared/lib";

export interface ImageItem {
  id: string;
  thumbnail: string;
  path: string;
  width: number;
  height: number;
  source: "thread" | "post";
  postId?: number;
  isVideo: boolean;
}

/**
 * レス一覧から全ての画像を抽出する
 * 1レス目（スレッド本文）もレス配列に含まれていることを前提とする
 */
export function extractImages(posts: Post[]): ImageItem[] {
  const images: ImageItem[] = [];

  // 全レス（1レス目を含む）から画像を抽出
  posts.forEach((post, index) => {
    if (post.attachment) {
      // 1レス目（display_id='1'）はスレッド画像として扱う
      const source = index === 0 ? "thread" : "post";
      const id = index === 0 ? `thread-${post.thread_id}` : `post-${post.id}`;
      images.push(createImageItem(post.attachment, source, id, post.id));
    }
  });

  return images;
}

function createImageItem(
  attachment: Attachment,
  source: "thread" | "post",
  id: string,
  postId?: number,
): ImageItem {
  return {
    id,
    thumbnail: resolveUploadPath(attachment.thumbnail),
    path: resolveUploadPath(attachment.path),
    width: attachment.width,
    height: attachment.height,
    source,
    postId,
    isVideo: isVideoAttachment(attachment),
  };
}
