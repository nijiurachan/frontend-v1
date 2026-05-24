import { useTurnstileStore } from "../stores/turnstileStore";

/**
 * Turnstile token を取得する。state==='ready' で token があれば即時返却、
 * なければ refresh を要求して awaitToken で待機する。
 *
 * 失敗時は `TurnstileTimeoutError` 等の Error を throw するので呼び出し元で
 * try/catch して UI 表示すること。
 *
 * React に依存しない plain async function として実装。将来的に
 * 他フロントエンドでも再利用できるようにしている。
 */
export async function acquireTurnstileToken(): Promise<string> {
  const store = useTurnstileStore.getState();
  if (store.token && store.state === "ready") {
    return store.token;
  }
  store.requestRefresh();
  return store.awaitToken();
}
