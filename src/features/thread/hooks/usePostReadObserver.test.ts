import { describe, expect, test } from "bun:test";
import { getLatestVisibleReplyNumber } from "./usePostReadObserver";

describe("getLatestVisibleReplyNumber", () => {
  test("画面内のうち最大のレス番号を返す", () => {
    expect(getLatestVisibleReplyNumber(new Set([4, 9, 7]))).toBe(9);
  });

  test("画面内にレス下端がなければ未記録にする", () => {
    expect(getLatestVisibleReplyNumber(new Set())).toBeUndefined();
  });
});
