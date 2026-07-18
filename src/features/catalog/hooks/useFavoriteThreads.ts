import { useMemo } from "react";
import type { Thread } from "@/entities/thread";
import {
  compareFavoriteJapanese,
  useFavStore,
} from "@/features/fav-filter/stores/favStore";

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

    const fav2: Array<{ thread: Thread; index: number }> = [];
    const fav1: Array<{ thread: Thread; index: number }> = [];
    const fav0: Thread[] = [];
    for (const [index, thread] of threads.entries()) {
      const level = isThreadFavorite(thread);
      if (level === 2) {
        fav2.push({ thread, index });
      } else if (level === 1) {
        fav1.push({ thread, index });
      } else {
        fav0.push(thread);
      }
    }
    const sortJapanese = (
      left: { thread: Thread; index: number },
      right: { thread: Thread; index: number },
    ): number =>
      compareFavoriteJapanese(
        left.thread.opPost.body,
        right.thread.opPost.body,
        left.index,
        right.index,
      );
    fav2.sort(sortJapanese);
    fav1.sort(sortJapanese);
    return [
      ...fav2.map(({ thread }) => thread),
      ...fav1.map(({ thread }) => thread),
      ...fav0,
    ];
  }, [threads, isThreadFavorite, favWords, favRegexes, favWords2, favRegexes2]);
}
