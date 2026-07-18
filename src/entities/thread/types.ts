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
  closedAt?: string | null;
  allowImageReplies?: boolean;
}

/** GET /api/threads/:threadId/chunks/:n の公開レス要素。 */
export interface ThreadChunkPost {
  id: string;
  seq: number;
  boardNo: number | null;
  body: string;
  createdAt: string;
  displayId: string | null;
  attachment: Post["attachment"];
}

/** 非公開レスのチャンク内プレースホルダ。 */
export interface ThreadUnavailablePost {
  seq: number;
  status: "unavailable";
}

export type ThreadChunkElement = ThreadChunkPost | ThreadUnavailablePost;

export function isThreadChunkPost(
  element: ThreadChunkElement,
): element is ThreadChunkPost {
  return !("status" in element) || element.status !== "unavailable";
}

export interface ThreadPostState {
  seq: number;
  status: "public" | "shadowed" | "trash" | "unavailable";
  reactions: {
    up: number;
    del: number;
  };
}

/** GET /api/threads/:threadId/state の可変状態。 */
export interface ThreadState {
  replyCount: number;
  bumpedAt: string;
  tags: ThreadTag[];
  closedAt: string | null;
  allowImageReplies: boolean;
  archivedAt?: string | null;
  postStates: ThreadPostState[];
  newPosts?: ThreadChunkElement[];
}

/** backend-v1 ThreadView */
export interface ThreadView {
  id: string;
  replyCount: number;
  createdAt: string;
  bumpedAt: string;
  tags: ThreadTag[];
  posts: Post[];
  closedAt: string | null;
  allowImageReplies: boolean;
  /** アーカイブ済みの場合のみ設定される。 */
  archivedAt?: string | null;
}

export interface TopPage {
  announcements: string[];
  threads: ThreadSummary[];
}

export interface Catalog {
  sort: "bump" | "new" | "old" | "replies" | "momentum" | "soudane";
  threads: ThreadSummary[];
  pagination: {
    page: number;
    limit: number;
    hasNextPage: boolean;
  };
}

export interface SearchResponse {
  query: string;
  posts: Post[];
}

/** 既存UIが Thread と呼んでいるドメイン型 */
export type Thread = ThreadSummary;
export type ThreadsResponse = Catalog;
export type ThreadDetailResponse = ThreadView;
