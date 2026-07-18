import type { Thread } from "@/entities/thread";
import { useCatalogStore } from "@/features/catalog/stores/catalogStore";
import { useNgStore } from "@/features/ng-filter/stores/ngStore";

/**
 * スレッド一覧に検索フィルターとNGフィルターを適用
 */
export function useFilteredThreads(threads: Thread[] | undefined): Thread[] {
  const { searchQuery, selectedTag } = useCatalogStore();
  const { isThreadHidden, showNgContent } = useNgStore();
  return filterCatalogThreads(
    threads,
    searchQuery,
    selectedTag,
    isThreadHidden,
    showNgContent,
  );
}

export function filterCatalogThreads(
  threads: Thread[] | undefined,
  searchQuery: string,
  selectedTag: string | null,
  isThreadHidden: (thread: Thread) => boolean,
  showNgContent: boolean,
): Thread[] {
  if (!threads) return [];

  return threads.filter((thread) => {
    // NG state changes must take effect in the same render as the store update.
    if (!showNgContent && isThreadHidden(thread)) return false;

    if (selectedTag && !thread.tags.some((tag) => tag.name === selectedTag)) {
      return false;
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      const body = thread.opPost.body.toLowerCase();
      if (!body.includes(query)) return false;
    }

    return true;
  });
}
