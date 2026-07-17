export interface CreatePostResult {
  threadId: string;
  postId: string;
  seq: number;
  status: "public" | "shadowed";
}
