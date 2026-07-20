import { useCallback, useEffect } from "react";
import { FiPlus } from "react-icons/fi";
import { CatalogGrid } from "@/features/catalog/components/lists";
import { SortNav } from "@/features/catalog/components/navigation";
import { useThreads } from "@/features/catalog/hooks";
import { useCatalogStore } from "@/features/catalog/stores";
import { ThreadCreateModal } from "@/features/thread/components/modals";
import { useThreadCreateModalStore } from "@/features/thread/stores/threadCreateModalStore";
import { BmgBanner } from "@/shared/ui/ad";
import { AnnounceBanner } from "@/shared/ui/announce/AnnounceBanner";
import { PullRefresh } from "@/shared/ui/feedback";

export const CatalogPage: React.FunctionComponent = () => {
  const { updateLastCatalogIds } = useCatalogStore();
  const isOpen = useThreadCreateModalStore((s) => s.isOpen);
  const open = useThreadCreateModalStore((s) => s.open);
  const close = useThreadCreateModalStore((s) => s.close);
  const { data, refetch } = useThreads();

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

  return (
    <>
      <title>{import.meta.env.APP_NAME}</title>
      <BmgBanner />
      <AnnounceBanner />
      <PullRefresh onRefresh={onRefresh}>
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
