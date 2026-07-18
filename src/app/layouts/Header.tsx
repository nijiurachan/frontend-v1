import { useLocation, useRouter } from "@tanstack/react-router";
import { AnimatePresence, motion } from "motion/react";
import {
  type FunctionComponent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { FiArrowLeft, FiSearch, FiX } from "react-icons/fi";
import { HiOutlineMenu } from "react-icons/hi";
import icon_aimoge from "@/assets/img/icon_aimoge.webp";
import icon_aimoge_dark1 from "@/assets/img/icon_aimoge_dark1.webp";
import icon_blumoge from "@/assets/img/icon_blumoge.webp";
import icon_main from "@/assets/img/icon_main.webp";
import { SearchBar } from "@/features/catalog/components";
import { getInitialHeaderScrollY } from "./headerScroll";

interface HeaderProps {
  onMenuClick: () => void;
}

export const Header: FunctionComponent<HeaderProps> = ({
  onMenuClick,
}: HeaderProps) => {
  const location = useLocation();
  const router = useRouter();
  const isThreadView = location.pathname.startsWith("/thread/");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const lastScrollYRef = useRef(getInitialHeaderScrollY());

  // 検索バーの開閉
  const toggleSearch = useCallback(() => {
    lastScrollYRef.current = window.scrollY;
    setIsHeaderVisible(true);
    setIsSearchOpen((prev) => !prev);
  }, []);

  // スクロール方向に応じてヘッダーの表示/非表示を切り替え
  useEffect((): (() => void) => {
    const SCROLL_THRESHOLD = 5;
    const TOP_OFFSET = 10;

    const handleScroll = (): void => {
      const currentScrollY = window.scrollY;
      const diff = currentScrollY - lastScrollYRef.current;

      // 検索バーが開いている間はヘッダーを隠さない
      if (isSearchOpen) {
        lastScrollYRef.current = currentScrollY;
        return;
      }

      if (currentScrollY < TOP_OFFSET) {
        setIsHeaderVisible(true);
      } else if (diff > SCROLL_THRESHOLD) {
        setIsHeaderVisible(false);
      } else if (diff < -SCROLL_THRESHOLD) {
        setIsHeaderVisible(true);
      }

      lastScrollYRef.current = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return (): void => window.removeEventListener("scroll", handleScroll);
  }, [isSearchOpen]);

  // 戻る処理：履歴があれば戻る、なければトップページへ遷移
  const handleBack = useCallback(() => {
    if (router.history.canGoBack?.()) {
      router.history.back();
    } else {
      router.navigate({ to: "/", replace: true });
    }
  }, [router]);

  return (
    <header
      className={`sticky top-0 z-20 pt-[env(safe-area-inset-top)] bg-card border-b border-border transition-transform duration-300 ${
        isHeaderVisible ? "translate-y-0" : "-translate-y-full"
      }`}
    >
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
      >
        本文へスキップ
      </a>
      <div className="flex items-center justify-between px-4 py-0">
        <button
          type="button"
          onClick={isThreadView ? handleBack : onMenuClick}
          className="w-12 h-11 flex items-center justify-center rounded-full hover:bg-muted transition-colors"
          aria-label={isThreadView ? "戻る" : "メニュー"}
        >
          {isThreadView ? (
            <FiArrowLeft className="w-6 h-6" />
          ) : (
            <HiOutlineMenu className="w-6 h-6" />
          )}
        </button>

        <div className="flex flex-col items-center">
          <span className="text-lg font-bold text-foreground flex items-center">
            二次元裏
            <img
              src={icon_main}
              alt="@"
              className="inline-block h-7 w-7 -translate-y-1 mx-0.5"
            />
            あいもげ
          </span>
          <div className="flex items-center gap-2 pt-1 pb-1">
            <a
              href="https://vote.nijiurachan.net/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex min-h-11 items-center gap-1 px-1 text-sm text-secondary hover:text-primary transition-colors"
            >
              <img src={icon_aimoge} alt="" className="h-6 w-6" />
              投票所
            </a>
            <a
              href="https://aimoge.fanbox.cc/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex min-h-11 items-center gap-1 px-1 text-sm text-secondary hover:text-primary transition-colors"
            >
              <img src={icon_aimoge_dark1} alt="" className="h-6 w-6" />
              FANBOX
            </a>
            <a
              href="https://wiki.nijiurachan.net/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex min-h-11 items-center gap-1 px-1 text-sm text-secondary hover:text-primary transition-colors"
            >
              <img src={icon_blumoge} alt="" className="h-6 w-6" />
              保管庫
            </a>
          </div>
        </div>

        {!isThreadView && (
          <>
            {/* デスクトップ: 検索バーを直接表示 */}
            <div className="hidden md:block">
              <SearchBar />
            </div>
            {/* モバイル: 虫眼鏡アイコンを表示 */}
            <button
              type="button"
              onClick={toggleSearch}
              className="md:hidden w-12 h-11 flex items-center justify-center rounded-full hover:bg-muted transition-colors"
              aria-label={isSearchOpen ? "検索を閉じる" : "検索"}
            >
              {isSearchOpen ? (
                <FiX className="w-6 h-6" />
              ) : (
                <FiSearch className="w-6 h-6" />
              )}
            </button>
          </>
        )}
        {isThreadView && <div className="w-12 h-11" />}
      </div>

      {/* モバイル: 検索バーを下に表示 */}
      {!isThreadView && (
        <AnimatePresence>
          {isSearchOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="md:hidden overflow-hidden"
            >
              <div className="flex justify-center px-4 py-3">
                <SearchBar />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </header>
  );
};
