import type { Post } from "@/entities/post";

export interface PopularPost {
  post: Post;
  ranking: number;
  /** 元のレス配列でのインデックス（0始まり） */
  originalIndex: number;
}

/**
 * そうだねが付いているレスを抽出してソートする
 * 1レス目（スレッド本文）もレス配列に含まれていることを前提とする
 * @param posts レスの配列（1レス目を含む）
 * @returns そうだね数の多い順に並んだレスのリスト
 */
export function extractPopularPosts(posts: Post[]): PopularPost[] {
  // レスをフィルタリング（元のインデックスも保持）
  const filteredPosts = posts
    .map((post, index) => ({ post, originalIndex: index }))
    .filter(({ post }) => 1 <= post.sodaneCount);

  // そうだね数の多い順にソート
  const sorted = filteredPosts.sort(
    (a, b) => b.post.sodaneCount - a.post.sodaneCount,
  );

  // ランキング番号を付与
  return sorted.map(({ post, originalIndex }, index) => ({
    post,
    ranking: index + 1,
    originalIndex,
  }));
}
