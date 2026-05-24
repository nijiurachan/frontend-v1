import { useCallback } from "react";
import { acquireTurnstileToken } from "../lib/acquireToken";
import { useTurnstileModeStore } from "../stores/turnstileModeStore";
import { useTurnstileStore } from "../stores/turnstileStore";

export type TurnstileResolveKind = "reply" | "thread";

/**
 * 投稿時の Turnstile token 解決 hook。`kind` でフォーム種別ごとの取得戦略を
 * 切り替える:
 *   - "reply":  light mode + hasSession なら token を待たず "empty" を返す
 *               (session 利用で素早く投稿)。手元に valid token があれば使う。
 *   - "thread": 常に fresh token を要求 (新スレ立ては必ず CF 通過)。
 *
 * 取得失敗時は内部で alert を出し `null` を返す (呼び出し側は null チェック
 * のみで abort 可能)。成功時は token 文字列を返す。
 */
export function useResolveTurnstileToken(
  kind: TurnstileResolveKind,
): () => Promise<string | null> {
  return useCallback(async () => {
    if (kind === "reply") {
      const { token, state, hasSession } = useTurnstileStore.getState();
      const noFreshToken = token === null || state !== "ready";
      const mode = useTurnstileModeStore.getState().mode;
      if (noFreshToken && mode === "light" && hasSession) {
        return "empty";
      }
    }
    try {
      return await acquireTurnstileToken();
    } catch (err) {
      alert(
        err instanceof Error
          ? err.message
          : "Turnstile トークン取得に失敗しました",
      );
      return null;
    }
  }, [kind]);
}
