import { describe, expect, test } from "bun:test";
import { createSubmissionLock } from "@/features/post/components/forms/submissionLock";

describe("createSubmissionLock", () => {
  test("送信開始から解放まで二重取得を拒否する", () => {
    const lock = createSubmissionLock();

    expect(lock.acquire()).toBe(true);
    expect(lock.isLocked()).toBe(true);
    expect(lock.acquire()).toBe(false);

    lock.release();
    expect(lock.isLocked()).toBe(false);
    expect(lock.acquire()).toBe(true);
  });
});
