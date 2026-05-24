declare global {
  interface Window {
    readonly turnstile?: Turnstile.Turnstile;
  }
}

let promise: Promise<Turnstile.Turnstile> | undefined;

/**
 * Turnstile API スクリプトを遅延読み込みし、window.turnstile を返す。
 * 成功時はキャッシュされた Promise を返す。失敗時はキャッシュをクリアして
 * 次回の呼び出しで再試行可能にする。
 */
export function loadTurnstile(): Promise<Turnstile.Turnstile> {
  if (promise) return promise;
  promise = new Promise<Turnstile.Turnstile>((resolve, reject) => {
    if (window.turnstile) {
      resolve(window.turnstile);
      return;
    }
    const script = document.createElement("script");
    script.src =
      "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    script.defer = true;
    script.async = true;
    script.onerror = (): void => {
      reject(new Error("Turnstile script failed to load"));
    };
    script.onload = (): void => {
      if (window.turnstile) {
        resolve(window.turnstile);
      } else {
        reject(
          new Error("Turnstile script loaded but window.turnstile is missing"),
        );
      }
    };
    document.head.appendChild(script);
  }).catch((err: unknown) => {
    // 失敗時はキャッシュ破棄して次回呼び出しで再試行可能にする
    promise = undefined;
    throw err;
  });
  return promise;
}
