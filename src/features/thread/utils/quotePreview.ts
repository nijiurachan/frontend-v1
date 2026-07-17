import type { Post } from "../../../entities/post";
import { stripQuoteLines } from "../../../shared/lib/quoteUtils";

/**
 * 引用行から、現在のレスより前にある引用元を全レス配列から解決する。
 * DOMに存在するレスを探さないため、仮想化窓の外にあるレスも対象にできる。
 */
export function resolveQuotedPost(
  quoteLine: string,
  currentSeq: number,
  allPosts: Post[],
): Post | null {
  const quoteText = quoteLine
    .trim()
    .replace(/^(?:(?:&gt;|>)+)\s*/, "")
    .trim();
  if (!quoteText) return null;

  const directSeq = quoteText.match(/^No\.(\d+)$/i)?.[1];
  const candidates = allPosts
    .filter((post) => post.seq < currentSeq)
    .sort((left, right) => right.seq - left.seq);

  if (directSeq !== undefined) {
    return candidates.find((post) => String(post.seq) === directSeq) ?? null;
  }

  const lowerQuote = quoteText.toLowerCase();
  return (
    candidates.find((post) => getSearchText(post).includes(lowerQuote)) ?? null
  );
}

function getSearchText(post: Post): string {
  return stripQuoteLines(
    [`No.${post.seq}`, post.attachment?.originalUrl ?? "", post.body].join(
      "\n",
    ),
  ).toLowerCase();
}
