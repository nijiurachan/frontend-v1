import type { Post } from "../../../entities/post";

export function resolvePostSeqFromHash(
  hash: string,
  posts: readonly Post[],
): number | null {
  const hashValue = hash.replace(/^#(?:post-)?/, "");
  if (!hashValue) return null;
  const post = posts.find(
    (candidate) =>
      candidate.id === hashValue || String(candidate.seq) === hashValue,
  );
  return post?.seq ?? null;
}
