import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "@tanstack/react-router";
import { AnimatePresence, motion, type PanInfo } from "motion/react";
import type { SyntheticEvent } from "react";
import {
  FiGrid,
  FiMonitor,
  FiMusic,
  FiRefreshCw,
  FiSettings,
  FiShieldOff,
  FiWatch,
  FiX,
} from "react-icons/fi";
import noImage from "@/assets/img/no-image.svg";
import type { ThreadSummary } from "@/entities/thread";
import { getImageUrl, getThreadTitle } from "@/entities/thread";
import { useHistoryStore } from "@/features/history/stores";
import { useSettingsStore } from "@/features/settings/hooks";
import { apiGet } from "@/shared/api";
import { MenuItem } from "./MenuItem";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const SideMenu: React.FunctionComponent<Props> = ({
  isOpen,
  onClose,
}: Props) => {
  const { getUnreadCount, getViewedIds } = useHistoryStore();
  const viewedIds = getViewedIds().slice(0, 20);
  const jukeboxEnabled = useSettingsStore((s) => s.jukeboxEnabled);
  const params = useParams({ strict: false });

  const {
    data: historyThreads = [],
    isError: isHistoryError,
    isFetching: isHistoryFetching,
    refetch: refetchHistory,
  } = useQuery({
    queryKey: ["history-threads", viewedIds],
    queryFn: async (): Promise<ThreadSummary[]> => {
      if (viewedIds.length === 0) return [];
      return apiGet<ThreadSummary[]>(
        `/threads?ids=${viewedIds.map(encodeURIComponent).join(",")}`,
      );
    },
    enabled: isOpen && viewedIds.length > 0,
    staleTime: 60_000,
  });

  const makePcVersionUrl = (): string =>
    params.threadId && !/\D/.test(params.threadId)
      ? `/pc/thread.php?id=${params.threadId}&pc=1`
      : "/pc/catalog.php?pc=1";

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 bg-black/60 z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.aside
            className="fixed top-0 left-0 bottom-0 w-72 pl-[env(safe-area-inset-left)] bg-card z-50 flex flex-col overflow-y-auto overscroll-contain"
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={{ left: 0.8, right: 0 }}
            onDragEnd={(_e: unknown, info: PanInfo): void => {
              if (info.offset.x < -100 || info.velocity.x < -500) {
                onClose();
              }
            }}
          >
            {/* ヘッダー */}
            <header className="flex items-center justify-between px-4 pt-[env(safe-area-inset-top)] border-b border-border bg-card sticky top-0 w-full flex-none basis-14">
              <h1 className="text-lg font-bold text-foreground">メニュー</h1>
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-muted"
              >
                <FiX className="w-5 h-5" />
              </button>
            </header>

            {/* メニュー項目 */}
            <nav className="p-2 border-b border-border">
              <MenuItem
                icon={<FiGrid className="w-5 h-5" />}
                to="/"
                onClick={onClose}
                isInternal
              >
                カタログに戻る
              </MenuItem>
              {jukeboxEnabled && (
                <MenuItem
                  icon={<FiMusic className="w-5 h-5" />}
                  to="/jukebox"
                  onClick={onClose}
                  isInternal
                >
                  ジュークボックス
                </MenuItem>
              )}
              <MenuItem
                icon={<FiSettings className="w-5 h-5" />}
                to="/settings"
                onClick={onClose}
                isInternal
              >
                設定
              </MenuItem>
              <MenuItem
                icon={<FiShieldOff className="w-5 h-5" />}
                href="/rules.html"
                isInternal
              >
                利用規約
              </MenuItem>
              <MenuItem
                icon={<FiWatch className="w-5 h-5" />}
                to="/archive"
                onClick={onClose}
              >
                過去ログ
              </MenuItem>
              <MenuItem
                icon={<FiMonitor className="w-5 h-5" />}
                href={makePcVersionUrl()}
                isInternal
              >
                PC版に切替
              </MenuItem>
            </nav>

            {/* 履歴 */}
            <div className="flex-1">
              <header className="flex items-center justify-between px-4 py-2 text-sm font-medium text-muted-foreground bg-card sticky top-14 w-full">
                <span>閲覧履歴</span>
                {viewedIds.length > 0 && (
                  <button
                    type="button"
                    onClick={(): void => void refetchHistory()}
                    disabled={isHistoryFetching}
                    aria-label="閲覧履歴を再取得"
                    className="rounded p-1 hover:bg-muted disabled:opacity-50"
                  >
                    <FiRefreshCw
                      className={isHistoryFetching ? "animate-spin" : ""}
                      aria-hidden="true"
                    />
                  </button>
                )}
              </header>
              {viewedIds.length === 0 ? (
                <div className="px-4 py-8 text-center text-muted-foreground text-sm">
                  閲覧履歴がありません
                </div>
              ) : isHistoryError ? (
                <div className="px-4 py-8 text-center text-muted-foreground text-sm">
                  閲覧履歴を取得できませんでした
                </div>
              ) : historyThreads.length === 0 && isHistoryFetching ? (
                <div className="px-4 py-8 text-center text-muted-foreground text-sm">
                  閲覧履歴を読み込み中...
                </div>
              ) : (
                <div className="space-y-1 px-2 pb-4">
                  {viewedIds.map((threadId) => {
                    const thread = historyThreads.find(
                      (candidate) => candidate.id === threadId,
                    );
                    if (!thread) return null;
                    const unreadCount = getUnreadCount(
                      thread.id,
                      thread.replyCount,
                    );
                    return (
                      <Link
                        key={thread.id}
                        to="/thread/$threadId"
                        params={{ threadId: thread.id }}
                        onClick={onClose}
                        className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-muted"
                      >
                        <img
                          src={getImageUrl(thread.opPost.attachment, false)}
                          alt=""
                          className="h-12 w-12 rounded bg-muted object-cover"
                          onError={(
                            event: SyntheticEvent<HTMLImageElement>,
                          ): void => {
                            event.currentTarget.src = noImage;
                          }}
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm text-foreground">
                            {getThreadTitle(thread)}
                          </span>
                          <span className="block text-xs text-muted-foreground">
                            {thread.replyCount}レス
                            {unreadCount && (
                              <span className="mx-1 text-primary">
                                未読{unreadCount}レス
                              </span>
                            )}
                          </span>
                        </span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};
