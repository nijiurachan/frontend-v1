/**
 * 引用行を除外してテキストを取得（&gt; または > で始まる行を除外）
 * @param text - プレーンテキスト
 * @returns 引用行を除いたテキスト
 */
export function stripQuoteLines(text: string): string {
  return text
    .split("\n")
    .filter((line) => {
      const trimmed = line.trim();
      return !trimmed.startsWith("&gt;") && !trimmed.startsWith(">");
    })
    .join("\n");
}

/**
 * テキストから引用部分を抽出
 * @param text - プレーンテキスト
 * @returns 引用テキストの配列（複数引用がある場合は複数）
 */
export function extractQuoteTexts(text: string): string[] {
  const lines = text.split("\n");
  const quoteTexts: string[] = [];
  let currentQuote: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    // 引用行の場合（&gt; または > で始まる）
    if (trimmed.startsWith("&gt;") || trimmed.startsWith(">")) {
      const quoteContent = trimmed.replace(/^(&gt;|>)\s*/, "");
      if (quoteContent) {
        currentQuote.push(quoteContent);
      }
    } else {
      // 引用行が終わった場合、現在の引用をまとめる
      if (currentQuote.length > 0) {
        quoteTexts.push(currentQuote.join("\n").trim());
        currentQuote = [];
      }
    }
  }

  // 最後の引用を追加
  if (currentQuote.length > 0) {
    quoteTexts.push(currentQuote.join("\n").trim());
  }

  return quoteTexts.filter((text) => text.length > 0);
}
