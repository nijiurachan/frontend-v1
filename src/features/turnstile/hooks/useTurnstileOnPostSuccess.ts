import { useCallback } from "react";
import { recordTokenUsage } from "../lib/lastTokenUsage";
import { useTurnstileStore } from "../stores/turnstileStore";

/**
 * post / thread create 成功時の Turnstile 側後処理 hook。
 *
 * - `tokenUsed` が `"empty"` 以外 (= 実 CF token を使った投稿) なら
 *   `recordTokenUsage()` で使用時刻を localStorage に記録 (フルリロード後の
 *   hasSession 復活判定に使う)。`"empty"` のときは記録しない。
 * - hasSession を立てたあとに手元 token を破棄 + widget reset (consumeToken)。
 *   light mode では次回以降の reply が token なしで通る。stable mode では
 *   hasSession を参照しないので無害。
 *
 * 呼び出し順について: 先に hasSession=true を立ててから consumeToken で widget
 * reset を行う。consumeToken の evaluator は同期的に `turnstile.reset()` を呼び
 * state を ready→idle へ動かすため、もし consumeToken を先にすると state が
 * idle になった瞬間の React レンダリングが「hasSession=false かつ
 * widgetState=idle」のスナップショットを掴み、白パネルの statusLabel が
 * "⌛️文章入力後に認証開始" を表示してしまうことがある。先に hasSession を立てて
 * おけば、ready 中は widgetState !== "idle" でパネル非表示、idle 復帰後は
 * hasSession=true で "✓ 投稿OK" 表示と、中間状態が出ない。
 * (recordTokenUsage は localStorage 書き込みのみなので順序は問わない。)
 */
export function useTurnstileOnPostSuccess(): (tokenUsed: string) => void {
  return useCallback((tokenUsed: string) => {
    if (tokenUsed !== "empty") {
      recordTokenUsage();
    }
    const s = useTurnstileStore.getState();
    s.startSession();
    s.consumeToken();
  }, []);
}
