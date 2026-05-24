/**
 * HTML文字列からURLを抽出する
 * @param html - HTML文字列
 * @returns URLの配列
 */
export function extractLinks(html: string): string[] {
  const urlRegex = /<a[^>]+href="([^"]+)"[^>]*>/gi;
  const links: string[] = [];
  // biome-ignore lint/suspicious/noImplicitAnyLet: モジュールごと置き換え予定
  let match;

  // biome-ignore lint/suspicious/noAssignInExpressions: モジュールごと置き換え予定
  while ((match = urlRegex.exec(html)) !== null) {
    links.push(match[1]);
  }

  return links;
}
