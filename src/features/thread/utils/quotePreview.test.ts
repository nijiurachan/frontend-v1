import { describe, expect, test } from "bun:test";
import type { Post } from "@/entities/post";
import {
  getQuotePostIndex,
  resolveQuotedPost,
} from "@/features/thread/utils/quotePreview";

function makePost(
  seq: number,
  body: string,
  boardNo: number | null = null,
): Post {
  return {
    id: `post-${seq}`,
    threadId: "thread-1",
    seq,
    boardNo,
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

  test("boardNoを優先して移行後のNo.引用を解決する", () => {
    const allPosts = [
      makePost(0, "元レス", 115496),
      makePost(1, "引用レス", 115497),
    ];

    expect(resolveQuotedPost(">No.115496", 1, allPosts)?.seq).toBe(0);
  });

  test("boardNoがない投稿はseqでNo.引用を解決する", () => {
    const allPosts = [makePost(7, "元レス"), makePost(8, "引用レス")];

    expect(resolveQuotedPost(">No.7", 8, allPosts)?.seq).toBe(7);
  });

  test("No.引用の前後判定はスレ内seqで行う", () => {
    const allPosts = [
      makePost(0, "現在のレス", 115496),
      makePost(1, "未来のレス", 115497),
    ];

    expect(resolveQuotedPost(">No.115497", 0, allPosts)).toBeNull();
  });

  test("同じ投稿配列の検索indexを再利用する", () => {
    const allPosts = [makePost(0, "zero"), makePost(1, "one")];

    expect(getQuotePostIndex(allPosts)).toBe(getQuotePostIndex(allPosts));
  });
});
