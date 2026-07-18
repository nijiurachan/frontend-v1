import { useMemo } from "react";
import type { Thread } from "@/entities/thread";
import { useCatalogStore } from "@/features/catalog/stores/catalogStore";
import { sortCatalogThreads } from "@/features/catalog/utils/catalogSort";
import { useNgStore } from "@/features/ng-filter/stores/ngStore";

/**
 * スレッド一覧に検索フィルターとNGフィルターを適用
 */
export function useFilteredThreads(threads: Thread[] | undefined): Thread[] {
  const { currentSort, sortDirection, searchQuery, selectedTag } =
    useCatalogStore();
  const { isThreadHidden, showNgContent } = useNgStore();

  return useMemo(() => {
    if (!threads) return [];

    const filteredThreads = threads.filter((thread) => {
      // 1. NGフィルター適用（showNgContentがtrueの場合はNGでもフィルタリングしない）
      if (!showNgContent && isThreadHidden(thread)) return false;

      if (selectedTag && !thread.tags.some((tag) => tag.name === selectedTag)) {
        return false;
      }

      // 2. 検索フィルター適用
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        // HTMLタグを除去した本文で検索
        const body = thread.opPost.body.toLowerCase();
        if (!body.includes(query)) return false;
      }

      return true;
    });

    return sortCatalogThreads(filteredThreads, currentSort, sortDirection);
  }, [
    threads,
    currentSort,
    sortDirection,
    searchQuery,
    selectedTag,
    isThreadHidden,
    showNgContent,
  ]);
}
