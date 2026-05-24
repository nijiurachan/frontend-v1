import type { Post } from "@/entities/post";
import { extractQuoteTexts, stripQuoteLines } from "@/shared/lib";

/**
 * 引用参照情報
 * key: 被引用レスのID
 * value: そのレスを引用している元レスのインデックス配列
 */
export type QuoteReferencesMap = Map<number, number[]>;

/**
 * スレッド内の引用関係を解析（最適化版）
 * @param posts スレッド内の全レス
 * @returns 被引用レスIDと引用元レスインデックスのマップ
 */
export function extractQuoteReferences(posts: Post[]): QuoteReferencesMap {
  const referencesMap = new Map<number, number[]>();
  // 各レスの引用を解析

  // TODO QuoteSearchModalで再利用できるようQuoteReferencesMapをクラスにして機能を足す

  // 事前処理: 全レスのテキストを一度だけ処理してキャッシュ
  const processedPosts = posts.map((post) => {
    // 全レス・ファイル名・レスNoから検索
    const plainText = [
      `No.${post.id}`,
      post.attachment?.path,
      ...post.body.map((line) => line.text),
    ].join("\n");
    const textWithoutQuotes = stripQuoteLines(plainText);
    return {
      id: post.id,
      lowerText: textWithoutQuotes.toLowerCase(),
      length: textWithoutQuotes.length,
    };
  });

  posts.forEach((post, sourceIndex) => {
    const plainText = post.plainBody;
    const quoteTexts = extractQuoteTexts(plainText);

    if (quoteTexts.length === 0) return;

    // このレスがどのレスを引用しているかを追跡（重複を防ぐ）
    const referencedInThisPost = new Set<number>();

    // 引用テキストごとに検索
    for (const quoteText of quoteTexts) {
      const lowerQuote = quoteText.toLowerCase();
      const quoteLength = lowerQuote.length;

      // 引用元より前のレスのみ対象（逆順で検索して早期マッチを優先）
      for (let targetIndex = sourceIndex - 1; targetIndex >= 0; targetIndex--) {
        // すでにこのレスへの参照を記録済みならスキップ
        if (referencedInThisPost.has(processedPosts[targetIndex].id)) continue;

        const processed = processedPosts[targetIndex];

        // 対象レスが引用テキストより短い場合はスキップ
        if (processed.length < quoteLength) continue;

        // 引用テキストが対象レスの内容に含まれているかチェック
        if (processed.lowerText.includes(lowerQuote)) {
          // マップに追加
          const existing = referencesMap.get(processed.id);
          if (existing) {
            existing.push(sourceIndex);
          } else {
            referencesMap.set(processed.id, [sourceIndex]);
          }

          // このレスへの参照を記録（同じレスへの複数参照を防ぐ）
          referencedInThisPost.add(processed.id);

          // マッチしたら次の引用テキストへ（同じ引用テキストで複数レスをマッチさせない）
          break;
        }
      }
    }
  });

  return referencesMap;
}
