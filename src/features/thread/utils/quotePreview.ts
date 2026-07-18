import { type Post, postNo } from "@/entities/post";
import { stripQuoteLines } from "@/shared/lib/quoteUtils";

interface IndexedPost {
  post: Post;
  searchText: string;
}

export interface QuotePostIndex {
  byNo: ReadonlyMap<number, Post>;
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
    byNo: new Map(allPosts.map((post) => [postNo(post), post])),
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
    const post = index.byNo.get(Number(directNo));
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
