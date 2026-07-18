import type { Attachment } from "@/entities/attachment";

/** 表示用に分解した本文の1行 */
export interface PostBodyLine {
  type: "text" | "quote";
  text: string;
}

/** backend-v1 PostView */
export interface Post {
  id: string;
  threadId: string;
  seq: number;
  /** ボード全体の通し番号 (旧AI_BBSのNo.)。backfill前の移行行のみ null */
  boardNo: number | null;
  status: "public" | "shadowed" | "trash" | "unavailable";
  body: string;
  createdAt: string;
  attachment: Attachment | null;
  sodaneCount: number;
  /** アーカイブ時点のdel数。旧レスポンス互換のため未提供時はundefined。 */
  delCount?: number;
  displayId: string | null;
}

/** 表示・引用に使う「No.」の値。通し番号が無い行はスレ内連番へフォールバックする。 */
export function postNo(post: Pick<Post, "seq" | "boardNo">): number {
  return post.boardNo ?? post.seq;
}

export function getPostBodyLines(body: string): PostBodyLine[] {
  return body.split(/\r?\n/).map((text) => ({
    type: text.startsWith(">") ? "quote" : "text",
    text,
  }));
}

export function getPostPlainBody(post: Pick<Post, "body">): string {
  return post.body;
}
