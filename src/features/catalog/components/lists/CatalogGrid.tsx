import { useMemo } from "react";
import { LoadingScreen, Message } from "@/shared/ui/feedback";
import { useFavoriteThreads } from "../../hooks/useFavoriteThreads";
import { useFilteredThreads } from "../../hooks/useFilteredThreads";
import { useThreads } from "../../hooks/useThreads";
import { useCatalogStore } from "../../stores/catalogStore";
import { CatalogItem } from "./CatalogItem";

export const CatalogGrid: React.FunctionComponent = () => {
  const { data, isLoading, error } = useThreads();
  const { columns, lastCatalogIds } = useCatalogStore();

  const filteredThreads = useFilteredThreads(data?.threads);
  const visibleThreads = useFavoriteThreads(filteredThreads);

  const newThreadIds = useMemo(() => {
    if (lastCatalogIds.length === 0) return new Set<number>();
    const lastSet = new Set(lastCatalogIds);
    return new Set(
      data?.threads.filter((t) => !lastSet.has(t.id)).map((t) => t.id) ?? [],
    );
  }, [data?.threads, lastCatalogIds]);

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (error) {
    return (
      <Message variant="error">スレッド一覧の読み込みに失敗しました</Message>
    );
  }

  if (visibleThreads.length === 0 && data?.threads && data.threads.length > 0) {
    return (
      <Message variant="info">
        検索条件に一致するスレッドが見つかりません
      </Message>
    );
  }

  return (
    <div
      className="grid gap-2 p-2 pb-2 auto-rows-fr grid-flow-dense"
      style={{
        gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
      }}
    >
      {visibleThreads.map((thread) => (
        <CatalogItem
          key={thread.id}
          thread={thread}
          isNew={newThreadIds.has(thread.id)}
        />
      ))}
    </div>
  );
};
