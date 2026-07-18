import { Link, useParams } from "@tanstack/react-router";
import { DesktopCatalogItem } from "@/features/catalog/components/desktop/DesktopCatalogItem";
import { CatalogItem } from "@/features/catalog/components/lists/CatalogItem";
import { useHistoryThreads } from "@/features/history/hooks/useHistoryThreads";
import { useHistoryStore } from "@/features/history/stores/historyStore";
import { usePostedHistoryStore } from "@/features/history/stores/postedHistoryStore";
import { useIsDesktop } from "@/shared/hooks/useMediaQuery";
import { LoadingScreen, Message } from "@/shared/ui/feedback";

export const HistoryPage: React.FunctionComponent = () => {
  const { mode: modeParam } = useParams({ from: "/history/$mode" });
  const mode = modeParam === "posted" ? "posted" : "viewed";
  const getViewedIds = useHistoryStore((state) => state.getViewedIds);
  const getPostedIds = usePostedHistoryStore((state) => state.getPostedIds);
  const viewedIds = getViewedIds();
  const postedIds = getPostedIds();
  const ids = mode === "posted" ? postedIds : viewedIds;
  const query = useHistoryThreads(mode, ids);
  const isDesktop = useIsDesktop();
  const title = mode === "posted" ? "書込履歴" : "見歴";

  return (
    <section className="history-page">
      <title>
        {title} - {import.meta.env.APP_NAME}
      </title>
      <nav aria-label="履歴メニュー" className="history-nav">
        <Link to="/">カタログ</Link>
        <Link to="/history/$mode" params={{ mode: "viewed" }}>
          見歴
        </Link>
        <Link to="/history/$mode" params={{ mode: "posted" }}>
          書込履歴
        </Link>
      </nav>
      <h1 className="text-xl font-bold">{title}</h1>
      <p className="text-sm text-muted-foreground">
        現在存在するスレッド {query.data?.length ?? 0}件
      </p>
      {ids.length === 0 ? (
        <Message variant="info">{title}はありません</Message>
      ) : query.isLoading ? (
        <LoadingScreen />
      ) : query.error ? (
        <Message variant="error">{title}の読み込みに失敗しました</Message>
      ) : query.data?.length === 0 ? (
        <Message variant="info">現在存在するスレッドはありません</Message>
      ) : (
        <div
          className={isDesktop ? "desktop-catalog-grid" : "history-mobile-grid"}
        >
          {query.data?.map((thread) =>
            isDesktop ? (
              <DesktopCatalogItem
                key={thread.id}
                thread={thread}
                isNew={false}
              />
            ) : (
              <CatalogItem key={thread.id} thread={thread} isNew={false} />
            ),
          )}
        </div>
      )}
    </section>
  );
};
