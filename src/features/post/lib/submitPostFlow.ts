import type { AltchaCredential } from "@/features/post/lib/altchaChallengeController";
import { ApiError } from "@/shared/api/errors";
import type { CreatePostResult } from "@/shared/api/types";

export type SubmitPostInput = {
  mode: "thread" | "reply";
  threadId?: string;
  body: string;
  deleteKey: string;
  file: File | null;
  r18?: boolean;
  allowImageReplies?: boolean;
  duration?: string;
  signal?: AbortSignal;
};

export type AltchaCredentialProvider = {
  getCredential: (signal?: AbortSignal) => Promise<AltchaCredential>;
  reset: () => void;
};

export type SubmitPostFlowDependencies = {
  uploadAttachment: (file: File, signal?: AbortSignal) => Promise<string>;
  post: (
    path: string,
    body: object,
    options: { token: string; signal?: AbortSignal },
  ) => Promise<CreatePostResult>;
  refreshToken: (expiredToken: string) => Promise<string>;
};

export async function submitPostFlow(
  {
    mode,
    threadId,
    body,
    deleteKey,
    file,
    r18 = false,
    allowImageReplies = true,
    duration = "",
    signal,
  }: SubmitPostInput,
  credentialProvider: AltchaCredentialProvider,
  dependencies: SubmitPostFlowDependencies,
): Promise<CreatePostResult> {
  if (mode === "reply" && !threadId) {
    throw new Error("スレッドIDがありません");
  }

  signal?.throwIfAborted();
  const attachmentId = file
    ? await dependencies.uploadAttachment(file, signal)
    : undefined;
  const path = mode === "thread" ? "/threads" : `/threads/${threadId}/posts`;
  const basePayload = {
    body,
    deleteKey,
    ...(attachmentId ? { attachmentId } : {}),
    ...(mode === "thread" ? { r18, allowImageReplies, duration } : {}),
  };

  let expiredToken: string | null = null;
  try {
    const credential = await getCredentialWithSignal(
      credentialProvider,
      signal,
    );
    try {
      return await postWithCredential(
        path,
        basePayload,
        credential,
        signal,
        dependencies,
      );
    } catch (error) {
      signal?.throwIfAborted();
      if (!isTokenExpired(error)) throw error;
      expiredToken = credential.token;
    }
  } finally {
    credentialProvider.reset();
  }

  if (expiredToken === null) {
    throw new Error("期限切れtokenを再取得できませんでした");
  }
  await dependencies.refreshToken(expiredToken);
  signal?.throwIfAborted();
  try {
    const credential = await getCredentialWithSignal(
      credentialProvider,
      signal,
    );
    return await postWithCredential(
      path,
      basePayload,
      credential,
      signal,
      dependencies,
    );
  } finally {
    credentialProvider.reset();
  }
}

async function getCredentialWithSignal(
  credentialProvider: AltchaCredentialProvider,
  signal: AbortSignal | undefined,
): Promise<AltchaCredential> {
  try {
    signal?.throwIfAborted();
    const credential = await credentialProvider.getCredential(signal);
    signal?.throwIfAborted();
    return credential;
  } catch (error) {
    // A widget reset can surface as null/a generic error. If the form lifecycle
    // was cancelled, normalize it to AbortError for the shared toast guard.
    signal?.throwIfAborted();
    throw error;
  }
}

function postWithCredential(
  path: string,
  basePayload: object,
  credential: AltchaCredential,
  signal: AbortSignal | undefined,
  dependencies: SubmitPostFlowDependencies,
): Promise<CreatePostResult> {
  signal?.throwIfAborted();
  return dependencies.post(
    path,
    { ...basePayload, altcha: credential.altcha },
    { token: credential.token, signal },
  );
}

function isTokenExpired(error: unknown): boolean {
  return error instanceof ApiError && error.code === "TOKEN_EXPIRED";
}
