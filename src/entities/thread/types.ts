import type { Attachment } from "@/entities/attachment";
import type { Post } from "@/entities/post";

export interface Thread {
  id: number;
  board_id: string;
  title: string | null;
  name: string;
  email: string;
  body: string;
  created_at: string;
  last_post_at: string;
  expires_at: string;
  is_sage: boolean;
  is_locked: boolean;
  is_permanent: boolean;
  allow_image_replies: boolean;
  is_admin: number;
  is_deleted: number;
  display_id: string | null;
  op_display_id: string | null;
  poster_id: string | null;
  op_is_warned: boolean;
  op_is_exposed: boolean;
  host: string | null;
  replies_count: number;
  soudane_count: number;
  op_post_id: number;
  is_archived: boolean;
  archived_at: string;
  storage_path: string;
  thumbnail_path: string;
  attachment: Attachment | null;
}

export interface ThreadsResponse {
  threads: Thread[];
  pagination: {
    page: number;
    total_pages: number;
    total_threads: number;
  };
}

export interface ThreadDetailResponse {
  thread: Thread;
  posts: Post[];
}
