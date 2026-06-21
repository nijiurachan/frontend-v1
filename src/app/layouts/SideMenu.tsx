import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "@tanstack/react-router";
import { AnimatePresence, motion, type PanInfo } from "motion/react";
import type { SyntheticEvent } from "react";
import {
  FiGrid,
  FiMonitor,
  FiSettings,
  FiShieldOff,
  FiWatch,
  FiX,
} from "react-icons/fi";
import noImage from "@/assets/img/no-image.svg";
import type { ThreadsResponse } from "@/entities/thread";
import { getImageUrl, getThreadTitle } from "@/entities/thread";
import { useHistoryStore } from "@/features/history/stores";
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
  const { getViewedIds, getUnreadCount } = useHistoryStore();
  const viewedIds = getViewedIds().slice(0, 10);
  const params = useParams({ strict: false });

  const makePcVersionUrl = (): string =>
    params.threadId && !/\D/.test(params.threadId)
      ? `/pc/thread.php?id=${params.threadId}&pc=1`
      : "/pc/catalog.php?pc=1";

  const { data } = useQuery({
    queryKey: ["history-threads", viewedIds],
    queryFn: async () => {
      if (viewedIds.length === 0) return { threads: [] };
      return apiGet<ThreadsResponse>(`/threads?ids=${viewedIds.join(",")}`);
    },
    enabled: isOpen && viewedIds.length > 0,
    staleTime: 60_000,
  });

  // ID順にソート
  const historyThreads =
    data?.threads
      .filter((t) => viewedIds.includes(t.id))
      .sort((a, b) => viewedIds.indexOf(a.id) - viewedIds.indexOf(b.id)) ?? [];

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
                href="/pc/archive.php"
                isInternal
              >
                過去ログ(PC版)
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
              <header className="px-4 py-2 text-sm font-medium text-muted-foreground bg-card sticky top-14 w-full">
                閲覧履歴
              </header>
              {historyThreads.length === 0 ? (
                <div className="px-4 py-8 text-center text-muted-foreground text-sm">
                  閲覧履歴がありません
                </div>
              ) : (
                <div className="px-2 pb-4 space-y-1">
                  {historyThreads.map((thread) => {
                    const unreadCount = getUnreadCount(
                      thread.id,
                      thread.replies_count,
                    );
                    return (
                      <Link
                        key={thread.id}
                        to="/thread/$threadId"
                        params={{ threadId: String(thread.id) }}
                        onClick={onClose}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors"
                      >
                        <img
                          src={getImageUrl(thread.attachment, false)}
                          alt=""
                          className="w-12 h-12 rounded object-cover bg-muted"
                          onError={(e: SyntheticEvent): void => {
                            (e.target as HTMLImageElement).src = noImage;
                          }}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm text-foreground truncate">
                            {getThreadTitle(thread)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {thread.replies_count}レス
                            {unreadCount && (
                              <span className="mx-1 text-primary">
                                未読{unreadCount}レス
                              </span>
                            )}
                          </div>
                        </div>
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
