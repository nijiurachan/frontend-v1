import { describe, expect, test } from "bun:test";
import {
  isAbortError,
  LatestSearchRequestGuard,
} from "@/features/thread/utils/latestSearchRequest";

describe("LatestSearchRequestGuard", () => {
  test("新しい検索開始時に旧検索をabortして結果更新権を失わせる", () => {
    const guard = new LatestSearchRequestGuard();
    const older = guard.start();
    const newer = guard.start();

    expect(older.signal.aborted).toBe(true);
    expect(guard.isCurrent(older)).toBe(false);
    expect(guard.isCurrent(newer)).toBe(true);
  });

  test("AbortErrorだけを中断として判定する", () => {
    expect(isAbortError(new DOMException("aborted", "AbortError"))).toBe(true);
    expect(isAbortError(new Error("network"))).toBe(false);
  });
});
