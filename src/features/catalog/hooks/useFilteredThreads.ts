import { useMemo } from "react";
import type { Thread } from "@/entities/thread";
import { useNgStore } from "@/features/ng-filter/stores/ngStore";
import { useCatalogStore } from "../stores/catalogStore";

/**
 * スレッド一覧に検索フィルターとNGフィルターを適用
 */
export function useFilteredThreads(threads: Thread[] | undefined): Thread[] {
  const { searchQuery } = useCatalogStore();
  const { isThreadHidden, showNgContent } = useNgStore();

  return useMemo(() => {
    if (!threads) return [];

    return threads.filter((thread) => {
      // 1. NGフィルター適用（showNgContentがtrueの場合はNGでもフィルタリングしない）
      if (!showNgContent && isThreadHidden(thread)) return false;

      // 2. 検索フィルター適用
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        // HTMLタグを除去した本文で検索
        const body = thread.body.replace(/<[^>]+>/g, "").toLowerCase();
        if (!body.includes(query)) return false;
      }

      return true;
    });
  }, [threads, searchQuery, isThreadHidden, showNgContent]);
}
