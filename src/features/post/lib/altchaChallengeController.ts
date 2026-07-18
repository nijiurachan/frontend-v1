export type AltchaOperation = "thread" | "reply";

export type AltchaCredential = {
  altcha: string;
  token: string;
};

type AltchaChallengeControllerOptions = {
  getToken: () => Promise<string>;
  fetchImpl?: typeof fetch;
};

export type AltchaChallengeController = {
  fetch: typeof fetch;
  getCredential: (payload: string) => AltchaCredential;
  reset: () => void;
  dispose: () => void;
};

export function getAltchaChallengePath(
  operation: AltchaOperation,
  apiBase: string = "/api",
): string {
  return `${apiBase}/altcha?op=${operation}`;
}

export function createAltchaChallengeController({
  getToken,
  fetchImpl = globalThis.fetch,
}: AltchaChallengeControllerOptions): AltchaChallengeController {
  let lifecycleController = new AbortController();
  let currentToken: string | null = null;
  let isDisposed = false;

  const fetchChallenge: typeof fetch = async (
    input: Parameters<typeof fetch>[0],
    init?: Parameters<typeof fetch>[1],
  ) => {
    if (isDisposed) {
      throw new DOMException("ALTCHA widget was disposed", "AbortError");
    }

    const activeController = lifecycleController;
    const token = await getToken();
    activeController.signal.throwIfAborted();
    currentToken = token;

    const headers = new Headers(init?.headers);
    headers.set("x-aimg-token", token);
    const signal = init?.signal
      ? AbortSignal.any([activeController.signal, init.signal])
      : activeController.signal;

    return fetchImpl(input, { ...init, headers, signal });
  };

  function reset(): void {
    lifecycleController.abort();
    lifecycleController = new AbortController();
    currentToken = null;
  }

  function dispose(): void {
    isDisposed = true;
    lifecycleController.abort();
    currentToken = null;
  }

  function getCredential(payload: string): AltchaCredential {
    if (!payload || !currentToken || isDisposed) {
      throw new Error("書き込み認証をもう一度確認してください");
    }
    return { altcha: payload, token: currentToken };
  }

  return { fetch: fetchChallenge, getCredential, reset, dispose };
}
