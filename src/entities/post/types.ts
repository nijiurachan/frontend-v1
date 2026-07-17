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
  status: "public" | "shadowed" | "unavailable";
  body: string;
  createdAt: string;
  attachment: Attachment | null;
  sodaneCount: number;
  displayId: string | null;
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
