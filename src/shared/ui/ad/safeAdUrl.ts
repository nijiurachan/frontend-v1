/** ぶるもげちゃん広告サーバの配信ベースURL */
export const ADS_BASE_URL = "https://nijiurachan.net";

/**
 * 広告サーバ由来のURLを検証して正規化する。相対パスは配信ベースに解決し、
 * https かつ nijiurachan.net（およびそのサブドメイン）かつポート指定なしの
 * URLだけを許可する。それ以外（`javascript:` / `data:` / 別ホスト / http /
 * ポート付き等）は弾いて null を返す。サーバが汚染された場合でも DOM の
 * href/src に危険な値を渡さないための防御。
 *
 * `click_url` は仕様上 `string | null`（null = リンク無し広告）になり得るため
 * null も受け付ける。null / 空文字 / 空白のみは「URL無し」として null を返す。
 */
export function safeAdUrl(raw: string | null): string | null {
  // null（リンク無し広告）/ 空文字 / 空白のみは「URL無し」として短絡で弾く。
  // 特に new URL("", base) は配信ベース自体（オリジン）に解決され有効扱いに
  // なってしまうため、ここで除外する。
  if (raw === null || raw.trim() === "") return null;
  try {
    const { protocol, port, host, href } = new URL(raw, ADS_BASE_URL);
    return protocol === "https:" &&
      port === "" &&
      (host === "nijiurachan.net" || host.endsWith(".nijiurachan.net"))
      ? href
      : null;
  } catch {
    return null;
  }
}
