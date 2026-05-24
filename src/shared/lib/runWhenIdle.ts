type IdleHandle = { cancel: () => void };

/**
 * requestIdleCallback でアイドル時に処理を実行する。iOS Safari など未対応環境では
 * setTimeout(1) にフォールバックする。返却ハンドルで cancel 可能。
 *
 * cancel 契約は cancellation flag で保証している。`cancelIdleCallback` が
 * 利用不能な実装や、既にコールバックが queue から取り出されている瞬間でも、
 * フラグチェックで実行を抑止する。
 */
export function runWhenIdle(
  callback: () => void,
  options: { timeout?: number } = {},
): IdleHandle {
  const { timeout = 2_000 } = options;
  let cancelled = false;
  const wrapped = (): void => {
    if (cancelled) return;
    callback();
  };

  const ric = (window as Window).requestIdleCallback;
  if (typeof ric === "function") {
    const id = ric(wrapped, { timeout });
    return {
      cancel: (): void => {
        cancelled = true;
        window.cancelIdleCallback?.(id);
      },
    };
  }

  const id = window.setTimeout(wrapped, 1);
  return {
    cancel: (): void => {
      cancelled = true;
      window.clearTimeout(id);
    },
  };
}
