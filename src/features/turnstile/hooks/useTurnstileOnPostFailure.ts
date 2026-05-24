import { useCallback } from "react";

/**
 * 投稿失敗時の Turnstile 側後処理 hook。
 * 現状 no-op (token は再利用するため保持)。将来 失敗カウント / token クリア /
 * toast 等を足す場合の hook point として用意。
 */
export function useTurnstileOnPostFailure(): () => void {
  return useCallback(() => {}, []);
}
