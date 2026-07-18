import { describe, expect, test } from "bun:test";
import {
  formatPostBodyLength,
  hasPostContent,
  POST_BODY_MAX_LENGTH,
} from "@/features/post/components/forms/postFormConfig";

describe("postFormConfig", () => {
  test("バックエンド既定値と同じ4000文字上限を表示する", () => {
    expect(POST_BODY_MAX_LENGTH).toBe(4000);
    expect(formatPostBodyLength(4000)).toBe("4000 / 4000文字");
  });

  test("本文または添付のどちらかがあれば投稿内容として扱う", () => {
    expect(hasPostContent("本文", false)).toBe(true);
    expect(hasPostContent("", true)).toBe(true);
    expect(hasPostContent("   ", false)).toBe(false);
  });
});
