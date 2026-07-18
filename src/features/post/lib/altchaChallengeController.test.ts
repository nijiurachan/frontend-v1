import { describe, expect, test } from "bun:test";
import {
  createAltchaChallengeController,
  getAltchaChallengePath,
} from "@/features/post/lib/altchaChallengeController";

const LEGACY_CHALLENGE = {
  algorithm: "SHA-256",
  challenge: "legacy-challenge",
  maxnumber: 100_000,
  salt: "legacy-salt",
  signature: "legacy-signature",
};

describe("ALTCHA challenge controller", () => {
  test("challenge path_threadとreplyを操作別queryへ変換する", () => {
    expect(getAltchaChallengePath("thread")).toBe("/api/altcha?op=thread");
    expect(getAltchaChallengePath("reply")).toBe("/api/altcha?op=reply");
  });

  test("custom fetch_token取得後に同じ明示tokenで旧challengeを取得する", async () => {
    const events: string[] = [];
    let requestToken: string | null = null;
    const controller = createAltchaChallengeController({
      getToken: async () => {
        events.push("token");
        return "managed-token";
      },
      fetchImpl: async (
        _input: Parameters<typeof fetch>[0],
        init?: Parameters<typeof fetch>[1],
      ) => {
        events.push("challenge");
        requestToken = new Headers(init?.headers).get("x-aimg-token");
        return Response.json(LEGACY_CHALLENGE);
      },
    });

    const response = await controller.fetch(getAltchaChallengePath("thread"));

    expect(events).toEqual(["token", "challenge"]);
    expect(requestToken).toBe("managed-token");
    expect(await response.json()).toEqual(LEGACY_CHALLENGE);
    expect(controller.getCredential("official-payload")).toEqual({
      altcha: "official-payload",
      token: "managed-token",
    });
  });

  test("reset_challenge fetchを中止して古いtoken結果を無効化する", async () => {
    let requestSignal: AbortSignal | undefined;
    const controller = createAltchaChallengeController({
      getToken: async () => "managed-token",
      fetchImpl: async (
        _input: Parameters<typeof fetch>[0],
        init?: Parameters<typeof fetch>[1],
      ) => {
        requestSignal = init?.signal ?? undefined;
        await new Promise<void>((_resolve, reject) => {
          requestSignal?.addEventListener(
            "abort",
            () => reject(requestSignal?.reason),
            { once: true },
          );
        });
        return Response.json(LEGACY_CHALLENGE);
      },
    });

    const pending = controller.fetch(getAltchaChallengePath("reply"));
    await Promise.resolve();
    controller.reset();

    expect(requestSignal?.aborted).toBe(true);
    await expect(pending).rejects.toBeInstanceOf(DOMException);
    expect(() => controller.getCredential("stale-payload")).toThrow();
  });
});
