import { useMemo } from "react";
import type { Thread } from "@/entities/thread";
import { useFavStore } from "@/features/fav-filter/stores/favStore";

/**
 * スレッド一覧をお気に入り判定に基づき並び替え（カタログ専用）
 * 超お気に入り(2) → お気に入り(1) → それ以外(0) の順に並べ替えて返す。
 */
export function useFavoriteThreads(threads: Thread[]): Thread[] {
  const { isThreadFavorite, favWords, favRegexes, favWords2, favRegexes2 } =
    useFavStore();

  return useMemo(() => {
    if (
      favWords.length === 0 &&
      favRegexes.length === 0 &&
      favWords2.length === 0 &&
      favRegexes2.length === 0
    ) {
      return threads;
    }

    const fav2: Thread[] = [];
    const fav1: Thread[] = [];
    const fav0: Thread[] = [];
    for (const thread of threads) {
      const level = isThreadFavorite(thread);
      if (level === 2) {
        fav2.push(thread);
      } else if (level === 1) {
        fav1.push(thread);
      } else {
        fav0.push(thread);
      }
    }
    return [...fav2, ...fav1, ...fav0];
  }, [threads, isThreadFavorite, favWords, favRegexes, favWords2, favRegexes2]);
}
