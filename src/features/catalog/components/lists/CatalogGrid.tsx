import { useMemo } from "react";
import { useIsDesktop } from "@/shared/hooks";
import { LoadingScreen, Message } from "@/shared/ui/feedback";
import { useFavoriteThreads } from "../../hooks/useFavoriteThreads";
import { useFilteredThreads } from "../../hooks/useFilteredThreads";
import { useOekakiFloor } from "../../hooks/useOekakiFloor";
import { useThreads } from "../../hooks/useThreads";
import { useCatalogStore } from "../../stores/catalogStore";
import { DesktopCatalogGrid } from "../desktop";
import { CatalogItem } from "./CatalogItem";

export const CatalogGrid: React.FunctionComponent = () => {
  const isDesktop = useIsDesktop();
  return isDesktop ? <DesktopCatalogGrid /> : <MobileCatalogGrid />;
};

const MobileCatalogGrid: React.FunctionComponent = () => {
  const { data, isLoading, error } = useThreads();
  const { columns, lastCatalogIds } = useCatalogStore();

  const filteredThreads = useFilteredThreads(data?.threads);
  // そうだね閾値を満たすお絵描きスレを中間ラインより下に沈ませない(お気に入りは最上位を維持するため後段で適用)
  const flooredThreads = useOekakiFloor(filteredThreads);
  const visibleThreads = useFavoriteThreads(flooredThreads);

  const newThreadIds = useMemo(() => {
    if (lastCatalogIds.length === 0) return new Set<string>();
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
      className="grid gap-2 p-2 pb-20 auto-rows-fr grid-flow-dense"
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
