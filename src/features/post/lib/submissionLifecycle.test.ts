import { describe, expect, test } from "bun:test";
import { createSubmissionLifecycle } from "@/features/post/lib/submissionLifecycle";

describe("submission lifecycle", () => {
  test("thread切替_進行中処理をabortして古い結果を無効化する", () => {
    const lifecycle = createSubmissionLifecycle();
    const first = lifecycle.begin();

    lifecycle.invalidate();

    expect(first.aborted).toBe(true);
    expect(lifecycle.isCurrent(first)).toBe(false);
    const second = lifecycle.begin();
    expect(second.aborted).toBe(false);
    expect(lifecycle.isCurrent(second)).toBe(true);
  });

  test("unmount_進行中処理をabortし以後のstate更新を許可しない", () => {
    const lifecycle = createSubmissionLifecycle();
    const signal = lifecycle.begin();

    lifecycle.dispose();

    expect(signal.aborted).toBe(true);
    expect(lifecycle.isCurrent(signal)).toBe(false);
    expect(() => lifecycle.begin()).toThrow();
  });
});
