import { describe, expect, test } from "vitest";
import {
  formatThreadExpiry,
  threadDurationHint,
  validateThreadDuration,
} from "@/features/thread/utils/threadExpiry";

describe("thread expiry UI", () => {
  test("shows the current maximum and minimum", () => {
    expect(
      threadDurationHint({
        activeThreads: 31,
        durationHours: 64,
        minimumMinutes: 30,
      }),
    ).toBe("現在の上限 64時間（最小30分、空欄は上限）");
  });

  test("accepts H:M/full-width colon and rejects boundary violations", () => {
    expect(validateThreadDuration("0：30", 64, 30)).toBeNull();
    expect(validateThreadDuration("", 64, 30)).toBeNull();
    expect(validateThreadDuration("0:29", 64, 30)).toMatch(/30分以上/);
    expect(validateThreadDuration("64:01", 64, 30)).toMatch(/64時間以内/);
    expect(validateThreadDuration("1:60", 64, 30)).toMatch(/H:M/);
  });

  test("formats finite and permanent expiry labels", () => {
    expect(formatThreadExpiry("2026-07-18T12:34:56.000Z", false)).toContain(
      "期限",
    );
    expect(formatThreadExpiry(null, true)).toBe("永久スレッド");
  });
});
