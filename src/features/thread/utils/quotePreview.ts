import { type Post, postNo } from "@/entities/post";
import { stripQuoteLines } from "@/shared/lib/quoteUtils";

interface IndexedPost {
  post: Post;
  searchText: string;
}

export interface QuotePostIndex {
  byBoardNo: ReadonlyMap<number, Post>;
  bySeqFallback: ReadonlyMap<number, Post>;
  descending: readonly IndexedPost[];
}

const quotePostIndexCache: WeakMap<Post[], QuotePostIndex> = new WeakMap();

export function getQuotePostIndex(allPosts: Post[]): QuotePostIndex {
  const cached = quotePostIndexCache.get(allPosts);
  if (cached) return cached;
  const descending = [...allPosts]
    .sort((left, right) => right.seq - left.seq)
    .map((post) => ({ post, searchText: getSearchText(post) }));
  const index: QuotePostIndex = {
    byBoardNo: new Map(
      allPosts.flatMap((post) =>
        post.boardNo === null ? [] : [[post.boardNo, post] as const],
      ),
    ),
    bySeqFallback: new Map(
      allPosts.flatMap((post) =>
        post.boardNo === null ? [[post.seq, post] as const] : [],
      ),
    ),
    descending,
  };
  quotePostIndexCache.set(allPosts, index);
  return index;
}

/**
 * 引用行から、現在のレスより前にある引用元を全レス配列から解決する。
 * DOMに存在するレスを探さないため、仮想化窓の外にあるレスも対象にできる。
 */
export function resolveQuotedPost(
  quoteLine: string,
  currentSeq: number,
  allPosts: Post[],
): Post | null {
  return resolveQuotedPostFromIndex(
    quoteLine,
    currentSeq,
    getQuotePostIndex(allPosts),
  );
}

export function resolveQuotedPostFromIndex(
  quoteLine: string,
  currentSeq: number,
  index: QuotePostIndex,
): Post | null {
  const quoteText = quoteLine
    .trim()
    .replace(/^(?:(?:&gt;|>)+)\s*/, "")
    .trim();
  if (!quoteText) return null;

  const directNo = quoteText.match(/^No\.(\d+)$/i)?.[1];
  if (directNo !== undefined) {
    const no = Number(directNo);
    const post = index.byBoardNo.get(no) ?? index.bySeqFallback.get(no);
    return post && post.seq < currentSeq ? post : null;
  }

  const lowerQuote = quoteText.toLowerCase();
  return (
    index.descending.find(
      ({ post, searchText }) =>
        post.seq < currentSeq && searchText.includes(lowerQuote),
    )?.post ?? null
  );
}

function getSearchText(post: Post): string {
  return stripQuoteLines(
    [`No.${postNo(post)}`, post.attachment?.originalUrl ?? "", post.body].join(
      "\n",
    ),
  ).toLowerCase();
}
