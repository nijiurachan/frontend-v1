import type { Post } from "@/entities/post";

export type ThreadTagKind = "fixed" | "free";
export type ThreadTagSource = "op" | "ai" | "moderator";

/** backend-v1 公開APIのタグ形状（addedAtは公開レスポンスに含まれない） */
export interface ThreadTag {
  name: string;
  kind: ThreadTagKind;
  source: ThreadTagSource;
}

/** backend-v1 ThreadSummary */
export interface ThreadSummary {
  id: string;
  opPost: Post;
  replyCount: number;
  createdAt: string;
  bumpedAt: string;
  tags: ThreadTag[];
}

/** backend-v1 ThreadView */
export interface ThreadView {
  id: string;
  replyCount: number;
  createdAt: string;
  bumpedAt: string;
  tags: ThreadTag[];
  posts: Post[];
}

export interface TopPage {
  announcements: string[];
  threads: ThreadSummary[];
}

export interface Catalog {
  sort: "bump" | "new" | "old" | "replies";
  threads: ThreadSummary[];
}

export interface SearchResponse {
  query: string;
  posts: Post[];
}

/** 既存UIが Thread と呼んでいるドメイン型 */
export type Thread = ThreadSummary;
export type ThreadsResponse = Catalog;
export type ThreadDetailResponse = ThreadView;
