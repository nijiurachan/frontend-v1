import { describe, expect, test } from "bun:test";
import { AimgTokenManager, shouldRetryManagedToken } from "./tokenManager";

describe("AimgTokenManager", () => {
  test("同時に期限切れを検知してもtoken再発行は1回に集約する", async () => {
    let issueCount = 0;
    const manager = new AimgTokenManager(async () => {
      issueCount += 1;
      await Promise.resolve();
      return issueCount === 1 ? "expired-token" : "fresh-token";
    });
    expect(await manager.get()).toBe("expired-token");

    const refreshed = await Promise.all([
      manager.refresh("expired-token"),
      manager.refresh("expired-token"),
      manager.refresh("expired-token"),
    ]);

    expect(refreshed).toEqual(["fresh-token", "fresh-token", "fresh-token"]);
    expect(issueCount).toBe(2);
  });

  test("管理tokenのTOKEN_EXPIREDだけを初回に限り再試行する", () => {
    expect(shouldRetryManagedToken(true, false, 0, "TOKEN_EXPIRED")).toBe(true);
    expect(shouldRetryManagedToken(true, false, 1, "TOKEN_EXPIRED")).toBe(
      false,
    );
    expect(shouldRetryManagedToken(true, true, 0, "TOKEN_EXPIRED")).toBe(false);
    expect(shouldRetryManagedToken(true, false, 0, "NO_CLEARANCE")).toBe(false);
  });
});
