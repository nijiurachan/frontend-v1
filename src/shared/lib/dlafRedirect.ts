/**
 * dlaf.jp は DLsite のアフィリエイトリダイレクタで、廃版・不正な作品 ID を
 * 渡すと別作品ページにフォールバック転送する挙動がある。OGP プロキシは
 * 最終リダイレクト先の OGP を返すため、要求 URL とは無関係な作品の
 * タイトル/画像が表示されてしまう。要求側 ID とレスポンス側 ID の差を
 * 検出してそうしたカードを抑制するための判定ヘルパ。
 */
export function isDlafIdMismatch(
  requestUrl: string,
  responseUrl: string,
): boolean {
  let host: string;
  try {
    host = new URL(requestUrl).hostname;
  } catch {
    return false;
  }
  if (host !== "dlaf.jp" && !host.endsWith(".dlaf.jp")) return false;

  const reqId = requestUrl.match(/RJ\d+/)?.[0];
  const resId = responseUrl.match(/RJ\d+/)?.[0];
  if (!reqId || !resId) return false;
  return reqId !== resId;
}
