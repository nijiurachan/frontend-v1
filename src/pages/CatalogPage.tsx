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
  const setSort = useCatalogStore((state) => state.setSort);
  const page = useCatalogStore((state) => state.page);
  const setPage = useCatalogStore((state) => state.setPage);
  const autoReload = useCatalogStore((state) => state.autoReload);
  const setAutoReload = useCatalogStore((state) => state.setAutoReload);
  const isOpen = useThreadCreateModalStore((s) => s.isOpen);
  const open = useThreadCreateModalStore((s) => s.open);
  const close = useThreadCreateModalStore((s) => s.close);
  const { data, refetch, isFetching } = useThreads();
  const isDesktop = useIsDesktop();

  const onRefresh = useCallback(async () => {
    if (isFetching) return;
    await refetch();
  }, [isFetching, refetch]);

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
          [<a href="/board">掲示板に戻る</a>]
          <button
            className="desktop-nav-link"
            type="button"
            aria-pressed={currentSort === "bump"}
            onClick={(): void => setSort("bump")}
          >
            カタログ
          </button>
          <button
            className="desktop-nav-link"
            type="button"
            aria-pressed={currentSort === "new"}
            onClick={(): void => setSort("new")}
          >
            新順
          </button>
          <button
            className="desktop-nav-link"
            type="button"
            aria-pressed={currentSort === "old"}
            onClick={(): void => setSort("old")}
          >
            古順
          </button>
          <button
            className="desktop-nav-link"
            type="button"
            aria-pressed={currentSort === "replies"}
            onClick={(): void => setSort("replies")}
          >
            多順
          </button>
          <button
            className="desktop-nav-link"
            type="button"
            aria-pressed={currentSort === "momentum"}
            onClick={(): void => setSort("momentum")}
          >
            勢順
          </button>
          <button
            className="desktop-nav-link"
            type="button"
            aria-pressed={currentSort === "soudane"}
            onClick={(): void => setSort("soudane")}
          >
            そ順
          </button>
          <a href="/history/viewed">見歴</a>
          <a href="/history/posted">書込歴</a>
          <a href="/settings">[設定]</a>
          <a href="/archive">過去ログ</a>
          <label className="desktop-auto-reload">
            自動更新
            <input
              type="checkbox"
              checked={autoReload}
              onChange={(event: React.ChangeEvent<HTMLInputElement>): void =>
                setAutoReload(event.target.checked)
              }
            />
          </label>
          <button
            type="button"
            disabled={isFetching}
            onClick={(): void => void onRefresh()}
          >
            {isFetching ? "更新中" : "[更新]"}
          </button>
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
        <CatalogPagination
          page={page}
          hasNextPage={data?.pagination.hasNextPage ?? false}
          isFetching={isFetching}
          onChange={setPage}
        />
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
        <CatalogPagination
          page={page}
          hasNextPage={data?.pagination.hasNextPage ?? false}
          isFetching={isFetching}
          onChange={setPage}
        />
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

interface CatalogPaginationProps {
  page: number;
  hasNextPage: boolean;
  isFetching: boolean;
  onChange: (page: number) => void;
}

const CatalogPagination: React.FunctionComponent<CatalogPaginationProps> = ({
  page,
  hasNextPage,
  isFetching,
  onChange,
}: CatalogPaginationProps) => (
  <nav aria-label="カタログのページ移動" className="catalog-pagination">
    <button
      type="button"
      disabled={page <= 1 || isFetching}
      onClick={(): void => onChange(page - 1)}
    >
      前へ
    </button>
    <span aria-live="polite">{page}ページ</span>
    <button
      type="button"
      disabled={!hasNextPage || isFetching}
      onClick={(): void => onChange(page + 1)}
    >
      次へ
    </button>
    {!hasNextPage && <span>最終ページ</span>}
  </nav>
);
