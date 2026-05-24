/**
 * HTMLエンティティをデコードする
 * @param text - HTMLエンティティを含む文字列
 * @returns デコード済みテキスト
 */
export function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&gt;/g, ">")
    .replace(/&lt;/g, "<")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}
