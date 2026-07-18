import { describe, expect, test } from "bun:test";
import type { AltchaCredential } from "@/features/post/lib/altchaChallengeController";
import {
  type AltchaCredentialProvider,
  type SubmitPostInput,
  submitPostFlow,
} from "@/features/post/lib/submitPostFlow";
import { ApiError } from "@/shared/api/errors";

const THREAD_INPUT: SubmitPostInput = {
  mode: "thread" as const,
  body: "本文",
  deleteKey: "delete-key",
  file: new File(["image"], "image.png", { type: "image/png" }),
  r18: false,
  allowImageReplies: true,
  duration: "1:00",
};

type CredentialProviderHarness = AltchaCredentialProvider & {
  getResetCount: () => number;
};

function createCredentialProvider(
  credentials: AltchaCredential[] = [{ altcha: "payload-1", token: "token-1" }],
): CredentialProviderHarness {
  let index = 0;
  let resetCount = 0;
  return {
    getCredential: async (): Promise<AltchaCredential> =>
      credentials[Math.min(index++, credentials.length - 1)],
    reset: (): void => {
      resetCount += 1;
    },
    getResetCount: (): number => resetCount,
  };
}

describe("submitPostFlow", () => {
  test("thread_公式payloadをJSON bodyへ入れ明示tokenで投稿する", async () => {
    const provider = createCredentialProvider();
    const posts: Array<{ path: string; body: object; token: string }> = [];
    let uploadCount = 0;

    const result = await submitPostFlow(THREAD_INPUT, provider, {
      uploadAttachment: async () => {
        uploadCount += 1;
        return "attachment-1";
      },
      post: async (
        path: string,
        body: object,
        options: { token: string; signal?: AbortSignal },
      ) => {
        posts.push({ path, body, token: options.token });
        return { postId: "post-1", threadId: "thread-1" };
      },
      refreshToken: async () => "unused",
    });

    expect(result.threadId).toBe("thread-1");
    expect(uploadCount).toBe(1);
    expect(posts).toEqual([
      {
        path: "/threads",
        token: "token-1",
        body: {
          body: "本文",
          altcha: "payload-1",
          deleteKey: "delete-key",
          attachmentId: "attachment-1",
          r18: false,
          allowImageReplies: true,
          duration: "1:00",
        },
      },
    ]);
  });

  test("reply_opに対応するpathとJSON payloadを使う", async () => {
    const provider = createCredentialProvider();
    const posts: Array<{ path: string; body: object }> = [];

    await submitPostFlow(
      {
        mode: "reply",
        threadId: "thread-7",
        body: "返信",
        deleteKey: "delete-key",
        file: null,
      },
      provider,
      {
        uploadAttachment: async () => "unused",
        post: async (path: string, body: object) => {
          posts.push({ path, body });
          return { postId: "post-2", threadId: "thread-7" };
        },
        refreshToken: async () => "unused",
      },
    );

    expect(posts).toEqual([
      {
        path: "/threads/thread-7/posts",
        body: {
          body: "返信",
          altcha: "payload-1",
          deleteKey: "delete-key",
        },
      },
    ]);
  });

  test("TOKEN_EXPIRED_fresh token・challenge・payloadで一度だけ再試行しuploadし直さない", async () => {
    const provider = createCredentialProvider([
      { altcha: "payload-1", token: "token-1" },
      { altcha: "payload-2", token: "token-2" },
    ]);
    const postedCredentials: Array<{ altcha: unknown; token: string }> = [];
    const refreshedTokens: string[] = [];
    let uploadCount = 0;

    await submitPostFlow(THREAD_INPUT, provider, {
      uploadAttachment: async () => {
        uploadCount += 1;
        return "attachment-1";
      },
      post: async (
        _path: string,
        body: object,
        options: { token: string; signal?: AbortSignal },
      ) => {
        postedCredentials.push({
          altcha: Reflect.get(body, "altcha"),
          token: options.token,
        });
        if (postedCredentials.length === 1) {
          throw new ApiError("token expired", 401, "TOKEN_EXPIRED");
        }
        return { postId: "post-1", threadId: "thread-1" };
      },
      refreshToken: async (expiredToken: string) => {
        refreshedTokens.push(expiredToken);
        return "token-2";
      },
    });

    expect(uploadCount).toBe(1);
    expect(refreshedTokens).toEqual(["token-1"]);
    expect(postedCredentials).toEqual([
      { altcha: "payload-1", token: "token-1" },
      { altcha: "payload-2", token: "token-2" },
    ]);
    expect(provider.getResetCount()).toBe(2);
  });

  test("TOKEN_EXPIRED_二回目は自動再送せずfresh状態へ戻す", async () => {
    const provider = createCredentialProvider([
      { altcha: "payload-1", token: "token-1" },
      { altcha: "payload-2", token: "token-2" },
    ]);
    let postCount = 0;

    await expect(
      submitPostFlow(THREAD_INPUT, provider, {
        uploadAttachment: async () => "attachment-1",
        post: async () => {
          postCount += 1;
          throw new ApiError("token expired", 401, "TOKEN_EXPIRED");
        },
        refreshToken: async () => "token-2",
      }),
    ).rejects.toMatchObject({ code: "TOKEN_EXPIRED" });

    expect(postCount).toBe(2);
    expect(provider.getResetCount()).toBe(2);
  });

  test.each([
    ["network結果不明", new TypeError("fetch failed")],
    ["429", new ApiError("too many requests", 429, "RATE_LIMITED")],
    ["ALTCHA_FAILED", new ApiError("invalid altcha", 403, "ALTCHA_FAILED")],
    ["一般業務エラー", new ApiError("thread closed", 409, "THREAD_CLOSED")],
  ])("%s_自動再送せずwidgetをfresh状態へ戻す", async (_label, error) => {
    const provider = createCredentialProvider();
    let postCount = 0;

    await expect(
      submitPostFlow(THREAD_INPUT, provider, {
        uploadAttachment: async () => "attachment-1",
        post: async () => {
          postCount += 1;
          throw error;
        },
        refreshToken: async () => "unused",
      }),
    ).rejects.toBe(error);

    expect(postCount).toBe(1);
    expect(provider.getResetCount()).toBe(1);
  });

  test("最初のcredential取得失敗でもproviderをresetする", async () => {
    const acquisitionError = new Error("widget verification failed");
    let resetCount = 0;
    const provider: AltchaCredentialProvider = {
      getCredential: async () => {
        throw acquisitionError;
      },
      reset: () => {
        resetCount += 1;
      },
    };

    await expect(
      submitPostFlow({ ...THREAD_INPUT, file: null }, provider, {
        uploadAttachment: async () => "unused",
        post: async () => {
          throw new Error("POST should not run");
        },
        refreshToken: async () => "unused",
      }),
    ).rejects.toBe(acquisitionError);

    expect(resetCount).toBe(1);
  });

  test("challenge・PoW中のlifecycle abortをAbortErrorへ正規化してproviderをresetする", async () => {
    const lifecycleController = new AbortController();
    let receivedSignal: AbortSignal | undefined;
    let resetCount = 0;
    const provider: AltchaCredentialProvider = {
      getCredential: async (signal?: AbortSignal) => {
        receivedSignal = signal;
        lifecycleController.abort();
        // Official widget reset can surface a generic failure/null result.
        throw new Error("widget was reset");
      },
      reset: () => {
        resetCount += 1;
      },
    };

    await expect(
      submitPostFlow(
        { ...THREAD_INPUT, file: null, signal: lifecycleController.signal },
        provider,
        {
          uploadAttachment: async () => "unused",
          post: async () => {
            throw new Error("POST should not run");
          },
          refreshToken: async () => "unused",
        },
      ),
    ).rejects.toMatchObject({ name: "AbortError" });

    expect(receivedSignal).toBe(lifecycleController.signal);
    expect(resetCount).toBe(1);
  });
});
