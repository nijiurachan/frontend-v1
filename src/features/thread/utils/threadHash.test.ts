import { describe, expect, test } from "bun:test";
import type { Post } from "@/entities/post";
import { resolvePostSeqFromHash } from "@/features/thread/utils/threadHash";

const posts = [
  { id: "op-id", seq: 0 },
  { id: "reply-id", seq: 12 },
] as Post[];

describe("resolvePostSeqFromHash", () => {
  test.each([
    ["#12", 12],
    ["#post-12", 12],
    ["#reply-id", 12],
    ["#post-reply-id", 12],
  ])("%sを投稿seqへ解決する", (hash, expectedSeq) => {
    expect(resolvePostSeqFromHash(hash, posts)).toBe(expectedSeq);
  });

  test("不明または空のhashはジャンプ対象にしない", () => {
    expect(resolvePostSeqFromHash("#missing", posts)).toBeNull();
    expect(resolvePostSeqFromHash("", posts)).toBeNull();
  });
});
