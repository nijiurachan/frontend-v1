import { describe, expect, test } from "bun:test";
import type { Post } from "../../../entities/post";
import {
  clearQuotePreviewCloseTimer,
  getQuotePreviewMode,
} from "./quoteHoverPreview";

function post(status: Post["status"]): Post {
  return { status } as Post;
}

describe("quote hover preview", () => {
  test("非public投稿は番号を含むpreview自体を表示しない", () => {
    expect(getQuotePreviewMode(post("shadowed"), true)).toBe("hidden");
    expect(getQuotePreviewMode(post("trash"), true)).toBe("hidden");
  });

  test("ジャンプcallbackが無いpublic投稿は操作不能のstatic表示にする", () => {
    expect(getQuotePreviewMode(post("public"), false)).toBe("static");
    expect(getQuotePreviewMode(post("public"), true)).toBe("interactive");
  });

  test("cleanupで予約済みclose timerを解除する", () => {
    const cleared: number[] = [];
    const timerRef = { current: 42 };

    clearQuotePreviewCloseTimer(timerRef, (timer) => cleared.push(timer));

    expect(cleared).toEqual([42]);
    expect(timerRef.current).toBeNull();
  });
});
