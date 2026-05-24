import type { Attachment } from "@/entities/attachment";

export interface PostBodyLine {
  type: "text" | "quote";
  text: string;
}

export interface Post {
  id: number;
  number_in_thread: number;
  thread_id: number;
  body: PostBodyLine[];
  plainBody: string;
  created_at: string;
  soudane_count: number;
  attachment: Attachment | null;
  display_id: string;
  is_admin: boolean;
  name: string;
  email: string;
}
