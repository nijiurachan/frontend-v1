import { describe, expect, test } from "bun:test";
import {
  isThreadInitialLoading,
  shouldShowThreadLoadError,
} from "@/shared/ui/feedback/threadLoadingState";

describe("isThreadInitialLoading", () => {
  test("state取得失敗後のdisabled chunkをローディング扱いしない", () => {
    expect(isThreadInitialLoading(false, false, false, true)).toBe(false);
  });

  test("state取得中とstate取得後のchunk取得中はローディング扱いする", () => {
    expect(isThreadInitialLoading(true, false, false, false)).toBe(true);
    expect(isThreadInitialLoading(false, false, true, true)).toBe(true);
  });

  test("アーカイブ表示ではchunk状態を無視する", () => {
    expect(isThreadInitialLoading(false, true, true, true)).toBe(false);
  });
});

describe("shouldShowThreadLoadError", () => {
  test("キャッシュ済みデータは再取得エラーで隠さない", () => {
    expect(shouldShowThreadLoadError(new Error("refresh failed"), true)).toBe(
      false,
    );
    expect(shouldShowThreadLoadError(new Error("initial failed"), false)).toBe(
      true,
    );
  });
});
