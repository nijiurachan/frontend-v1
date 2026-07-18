import { useCallback, useEffect } from "react";
import { FiPlus } from "react-icons/fi";
import { CatalogGrid } from "@/features/catalog/components/lists";
import { SortNav } from "@/features/catalog/components/navigation";
import { TagFilter } from "@/features/catalog/components/TagFilter";
import { useThreads } from "@/features/catalog/hooks";
import { useCatalogStore } from "@/features/catalog/stores";
import { DesktopThreadCreatePanel } from "@/features/thread/components/desktop";
import { ThreadCreateModal } from "@/features/thread/components/modals";
import { useThreadCreateModalStore } from "@/features/thread/stores/threadCreateModalStore";
import { useIsDesktop } from "@/shared/hooks";
import { BmgBanner } from "@/shared/ui/ad";
import { PullRefresh } from "@/shared/ui/feedback";

export const CatalogPage: React.FunctionComponent = () => {
  const updateLastCatalogIds = useCatalogStore(
    (state) => state.updateLastCatalogIds,
  );
  const currentSort = useCatalogStore((state) => state.currentSort);
  const sortDirection = useCatalogStore((state) => state.sortDirection);
  const setSort = useCatalogStore((state) => state.setSort);
  const isOpen = useThreadCreateModalStore((s) => s.isOpen);
  const open = useThreadCreateModalStore((s) => s.open);
  const close = useThreadCreateModalStore((s) => s.close);
  const { data, refetch } = useThreads();
  const isDesktop = useIsDesktop();

  const onRefresh = useCallback(async () => {
    await refetch();
  }, [refetch]);

  // カタログページを離れる時に現在のスレッドIDを保存
  useEffect(() => {
    return (): void => {
      if (data?.threads) {
        updateLastCatalogIds(data.threads.map((t) => t.id));
      }
    };
  }, [data, updateLastCatalogIds]);

  // useThreadCreateModalStore はグローバルな zustand なので、ページ離脱時に
  // close() しないと再訪時に modal が開きっぱなしになる
  useEffect(() => {
    return (): void => {
      close();
    };
  }, [close]);

  if (isDesktop) {
    return (
      <div className="desktop-catalog-page">
        <nav
          className="desktop-catalog-nav"
          aria-label="カタログナビゲーション"
        >
          [<a href="/">掲示板に戻る</a>]
          <a
            href="/"
            aria-current={
              currentSort === "bump" && sortDirection === "desc"
                ? "true"
                : undefined
            }
            onClick={(): void => setSort("bump", "desc")}
          >
            カタログ
          </a>
          <button
            className="desktop-nav-link"
            type="button"
            aria-pressed={currentSort === "date" && sortDirection === "desc"}
            onClick={(): void => setSort("date", "desc")}
          >
            新順
          </button>
          <button
            className="desktop-nav-link"
            type="button"
            aria-pressed={currentSort === "date" && sortDirection === "asc"}
            onClick={(): void => setSort("date", "asc")}
          >
            古順
          </button>
          <button
            className="desktop-nav-link"
            type="button"
            aria-pressed={currentSort === "replies" && sortDirection === "desc"}
            onClick={(): void => setSort("replies", "desc")}
          >
            多順
          </button>
          <a href="/archive">過去ログ</a>
          <button type="button" onClick={open}>
            [スレ立て]
          </button>
        </nav>
        <h1 className="desktop-mode-title">カタログモード</h1>
        <BmgBanner />
        <div className="desktop-catalog-tools">
          <TagFilter threads={data?.threads ?? []} />
        </div>
        <CatalogGrid />
        <DesktopThreadCreatePanel isOpen={isOpen} onClose={close} />
      </div>
    );
  }

  return (
    <>
      <title>{import.meta.env.APP_NAME}</title>
      <BmgBanner />
      <PullRefresh onRefresh={onRefresh}>
        <TagFilter threads={data?.threads ?? []} />
        <CatalogGrid />
      </PullRefresh>
      <SortNav
        primaryAction={{
          icon: FiPlus,
          label: "新規スレッド",
          onClick: open,
        }}
      />
      <ThreadCreateModal isOpen={isOpen} onClose={close} />
    </>
  );
};
