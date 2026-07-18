import { useMemo } from "react";
import type { Thread } from "@/entities/thread";
import { useCatalogStore } from "@/features/catalog/stores/catalogStore";
import { useNgStore } from "@/features/ng-filter/stores/ngStore";

/**
 * スレッド一覧に検索フィルターとNGフィルターを適用
 */
export function useFilteredThreads(threads: Thread[] | undefined): Thread[] {
  const { searchQuery, selectedTag } = useCatalogStore();
  const { isThreadHidden, showNgContent } = useNgStore();

  return useMemo(() => {
    if (!threads) return [];

    return threads.filter((thread) => {
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
  }, [threads, searchQuery, selectedTag, isThreadHidden, showNgContent]);
}
