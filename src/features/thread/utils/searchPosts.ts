import type { Post } from "@/entities/post";

export interface SearchResult {
  post: Post;
  index: number;
}

/**
 * スレッド内のレスを検索する
 * 1レス目（スレッド本文）もレス配列に含まれていることを前提とする
 * @param posts レスの配列（1レス目を含む）
 * @param query 検索キーワード
 * @returns 検索にマッチしたレスのリスト
 */
export function searchPosts(posts: Post[], query: string): SearchResult[] {
  if (!query.trim()) {
    return [];
  }

  const results: SearchResult[] = [];
  const lowerQuery = query.toLowerCase();

  // 全レス（1レス目を含む）を検索
  posts.forEach((post, index) => {
    const postText = post.body.toLowerCase();
    if (postText.includes(lowerQuery)) {
      results.push({ post, index });
    }
  });

  return results;
}
