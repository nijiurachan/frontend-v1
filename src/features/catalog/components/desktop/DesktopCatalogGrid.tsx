import { useMemo } from "react";
import { LoadingScreen, Message } from "@/shared/ui/feedback";
import { useFavoriteThreads } from "../../hooks/useFavoriteThreads";
import { useFilteredThreads } from "../../hooks/useFilteredThreads";
import { useOekakiFloor } from "../../hooks/useOekakiFloor";
import { useThreads } from "../../hooks/useThreads";
import { useCatalogStore } from "../../stores/catalogStore";
import { DesktopCatalogItem } from "./DesktopCatalogItem";

export const DesktopCatalogGrid: React.FunctionComponent = () => {
  const { data, isLoading, error } = useThreads();
  const filteredThreads = useFilteredThreads(data?.threads);
  const visibleThreads = useFavoriteThreads(useOekakiFloor(filteredThreads));
  const lastCatalogIds = useCatalogStore((state) => state.lastCatalogIds);
  const newThreadIds = useMemo(() => {
    if (lastCatalogIds.length === 0) return new Set<string>();
    const previous = new Set(lastCatalogIds);
    return new Set(
      data?.threads
        .filter((thread) => !previous.has(thread.id))
        .map((thread) => thread.id) ?? [],
    );
  }, [data?.threads, lastCatalogIds]);

  if (isLoading) return <LoadingScreen />;
  if (error) {
    return (
      <Message variant="error">スレッド一覧の読み込みに失敗しました</Message>
    );
  }
  if (visibleThreads.length === 0) {
    return <Message variant="info">スレッドが見つかりません</Message>;
  }

  return (
    <div className="desktop-catalog-grid-wrap">
      <div className="desktop-catalog-grid">
        {visibleThreads.map((thread) => (
          <DesktopCatalogItem
            key={thread.id}
            thread={thread}
            isNew={newThreadIds.has(thread.id)}
          />
        ))}
      </div>
    </div>
  );
};
