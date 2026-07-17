import { describe, expect, test } from "bun:test";
import type { Post } from "../../../entities/post";
import { getQuotePostIndex, resolveQuotedPost } from "./quotePreview";

function makePost(seq: number, body: string): Post {
  return {
    id: `post-${seq}`,
    threadId: "thread-1",
    seq,
    status: "public",
    body,
    createdAt: new Date(0).toISOString(),
    attachment: null,
    sodaneCount: 0,
    displayId: null,
  };
}

describe("resolveQuotedPost", () => {
  test("末尾レスから仮想化窓外の先頭レスを解決する", () => {
    const allPosts = Array.from({ length: 1000 }, (_, seq) =>
      makePost(seq, seq === 0 ? "仮想化窓外の引用元" : `本文 ${seq}`),
    );

    const source = resolveQuotedPost(">No.0", 999, allPosts);

    expect(source?.id).toBe("post-0");
  });

  test("レス番号がない引用は本文から直前のレスを解決する", () => {
    const allPosts = [
      makePost(0, "元レスの本文"),
      makePost(1, ">元レスの本文"),
    ];

    expect(resolveQuotedPost(">元レスの本文", 1, allPosts)?.seq).toBe(0);
  });

  test("同じ投稿配列の検索indexを再利用する", () => {
    const allPosts = [makePost(0, "zero"), makePost(1, "one")];

    expect(getQuotePostIndex(allPosts)).toBe(getQuotePostIndex(allPosts));
  });
});
