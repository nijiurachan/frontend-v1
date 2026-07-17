import { useParams } from "@tanstack/react-router";
import { AnimatePresence, motion, type PanInfo } from "motion/react";
import {
  FiGrid,
  FiMonitor,
  FiMusic,
  FiSettings,
  FiShieldOff,
  FiWatch,
  FiX,
} from "react-icons/fi";
import { useSettingsStore } from "@/features/settings/hooks";
import { MenuItem } from "./MenuItem";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const SideMenu: React.FunctionComponent<Props> = ({
  isOpen,
  onClose,
}: Props) => {
  const jukeboxEnabled = useSettingsStore((s) => s.jukeboxEnabled);
  const params = useParams({ strict: false });

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
              <header className="px-4 py-2 text-sm font-medium text-muted-foreground bg-card sticky top-14 w-full">
                閲覧履歴
              </header>
              <div className="px-4 py-8 text-center text-muted-foreground text-sm">
                閲覧履歴のスレッド再取得は backend-v1 の公開 API 未対応です
              </div>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};
