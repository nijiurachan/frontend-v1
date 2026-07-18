import { useNavigate, useSearch } from "@tanstack/react-router";
import { ArchiveStorageGauge } from "@/features/archive/components/ArchiveStorageGauge";
import { ArchiveGrid } from "@/features/archive/components/lists/ArchiveGrid";
import { useArchiveStorage } from "@/features/archive/hooks/useArchiveStorage";
import { useArchiveThreads } from "@/features/archive/hooks/useArchiveThreads";
import { LoadingScreen, Message } from "@/shared/ui/feedback";
import { Button } from "@/shared/ui/form";

export const ArchivePage: React.FunctionComponent = () => {
  const { page = 1 } = useSearch({ from: "/archive" });
  const navigate = useNavigate({ from: "/archive" });
  const archiveQuery = useArchiveThreads(page);
  const storageQuery = useArchiveStorage();

  if (archiveQuery.isLoading) {
    return <LoadingScreen />;
  }

  if (archiveQuery.error || !archiveQuery.data) {
    return <Message variant="error">過去ログの読み込みに失敗しました</Message>;
  }

  const { data } = archiveQuery;
  // 専用エンドポイントが失敗しても一覧レスポンス埋め込みの容量情報で継続する
  const storage = storageQuery.data ?? data.storage;

  const totalPages = Math.max(1, data.pagination.totalPages);
  const changePage = (nextPage: number): void => {
    void navigate({ search: { page: nextPage } });
  };
  const pagination = totalPages > 1 && (
    <nav
      aria-label="過去ログのページ移動"
      className="flex flex-wrap items-center justify-center gap-2 px-4 py-3"
    >
      <Button
        variant="default"
        disabled={page <= 1}
        onClick={(): void => changePage(1)}
      >
        先頭
      </Button>
      <Button
        variant="default"
        disabled={page <= 1}
        onClick={(): void => changePage(page - 1)}
      >
        前へ
      </Button>
      {Array.from(
        { length: Math.min(11, totalPages) },
        (_, index) => Math.max(1, Math.min(totalPages - 10, page - 5)) + index,
      ).map((number) => (
        <Button
          key={number}
          variant={number === page ? "primary" : "default"}
          onClick={(): void => changePage(number)}
          aria-current={number === page ? "page" : undefined}
        >
          {number}
        </Button>
      ))}
      <Button
        variant="default"
        disabled={page >= totalPages}
        onClick={(): void => changePage(page + 1)}
      >
        次へ
      </Button>
      <Button
        variant="default"
        disabled={page >= totalPages}
        onClick={(): void => changePage(totalPages)}
      >
        末尾
      </Button>
    </nav>
  );

  return (
    <>
      <title>過去ログ - {import.meta.env.APP_NAME}</title>
      <header className="px-4 pt-4">
        <h1 className="text-xl font-bold text-foreground">過去ログ</h1>
      </header>
      {storage && <ArchiveStorageGauge storage={storage} />}
      {pagination}
      <ArchiveGrid threads={data.threads} />
      {pagination}
    </>
  );
};
