import { describe, expect, test } from "bun:test";
import { isSearchPending } from "@/features/thread/utils/searchModalState";

describe("isSearchPending", () => {
  test("debounce完了後も非同期検索中なら検索中表示を維持する", () => {
    expect(isSearchPending("query", "query", true)).toBe(true);
    expect(isSearchPending("query", "query", false)).toBe(false);
  });
});
