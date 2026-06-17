import { Link } from "@tanstack/react-router";
import clsx from "clsx";
import { memo, useMemo, useState } from "react";
import { HiOutlineDotsVertical } from "react-icons/hi";
import { MdBlock } from "react-icons/md";
import fireWebp from "@/assets/img/fire.webp";
import noImage from "@/assets/img/no-image.svg";
import type { Thread } from "@/entities/thread";
import { getImageUrl, getThreadTitle } from "@/entities/thread";
import { useHistoryStore } from "@/features/history/stores/historyStore";
import { useNgStore } from "@/features/ng-filter/stores";
import { useLongPress } from "@/shared/hooks";
import { decorateTitle, isVideoAttachment } from "@/shared/lib";
import { VideoBadge } from "@/shared/ui/media";
import { useCatalogStore } from "../../stores/catalogStore";
import { ThreadContextMenu } from "../actions/ThreadContextMenu";

interface CatalogItemProps {
  thread: Thread;
  isNew: boolean;
}

export const CatalogItem: React.FunctionComponent<CatalogItemProps> = memo(
  function CatalogItem({ thread, isNew }: CatalogItemProps) {
    const { showNew, showCount, catalogAnim, threadMenuOpenMethod } =
      useCatalogStore();
    const { addViewed, getViewedIds } = useHistoryStore();
    const { isThreadHidden, showNgContent } = useNgStore();
    const [menuOpen, setMenuOpen] = useState(false);
    const [ngRevealed, setNgRevealed] = useState(false);

    // カタログでのアニメ画像が許可されている場合のみアニメ画像のみ動かし、それ以外の場合は動かさない
    const imageUrl = getImageUrl(
      thread.attachment,
      catalogAnim === "always" && (thread.attachment?.is_animated ?? false),
    );
    const title = getThreadTitle(thread);
    const displayTitle = decorateTitle(title);
    const totalCount = thread.replies_count;
    const isVideo = thread.attachment
      ? isVideoAttachment(thread.attachment)
      : false;
    const isNg = showNgContent && isThreadHidden(thread);

    // 既読判定
    const viewedIds = getViewedIds();
    const isViewed = viewedIds.includes(thread.id);

    // お絵描き判定
    const isOekaki = thread.attachment?.is_oekaki ?? false;

    // 枠線スタイル決定（優先順位: 運営 > 既読×お絵描き > 既読 > お絵描き）
    // 上から順に最初に一致したものだけを適用する（条件追加は1行で済む）
    const borderClass = ((): string => {
      if (thread.is_admin) return "border-3 border-accent";
      if (isViewed && isOekaki) return "viewed-oekaki-border";
      if (isViewed) return "border-3 border-primary";
      if (isOekaki) return "border-3 border-otegaki";
      return "";
    })();

    // スレメニュー表示方法を判別する
    const [longPressOpensMenu, isMenuButtonDisplayed] = useMemo(() => {
      if (threadMenuOpenMethod === "auto") {
        // 「自動」の場合は自動判別を行う
        if (
          typeof window !== "undefined" &&
          window.matchMedia("(pointer: fine)").matches
        ) {
          // マウスが存在する環境の場合(PC)はメニューボタンへ判別する
          return [false, true];
        } else {
          // それ以外の場合は長押しへ判別する。
          // これは何らかの理由によりwindowが利用できない場合を含む(当設定が追加される前の挙動を真似する)
          return [true, false];
        }
      } else if (threadMenuOpenMethod === "long-press") {
        return [true, false];
      } else if (threadMenuOpenMethod === "menu-button") {
        return [false, true];
      } else if (threadMenuOpenMethod === "off") {
        return [false, false];
      } else {
        throw new Error(
          `Unexpected value: ${threadMenuOpenMethod satisfies never}`,
        );
      }
    }, [threadMenuOpenMethod]);

    const longPressHandlers = useLongPress({
      onLongPress: (): void => setMenuOpen(true),
    });

    const handleNgClick = (e: React.MouseEvent): void => {
      if (isNg) {
        e.preventDefault();
        e.stopPropagation();
        setNgRevealed(!ngRevealed);
      }
    };

    const handleThreadClick = (e: React.MouseEvent): void => {
      if (isNg) {
        handleNgClick(e);
      } else {
        addViewed(thread.id);
      }
    };

    const handleMenuClick = (): void => {
      setMenuOpen(true);
    };

    return (
      <>
        <div
          className={clsx(
            "group relative bg-card/50 rounded-lg overflow-hidden hover:bg-card transition-colors",
            borderClass,
          )}
        >
          {thread.is_admin ? (
            <img
              src={fireWebp}
              alt=""
              aria-hidden="true"
              className="admin-flame"
            />
          ) : null}
          <Link
            to="/thread/$threadId"
            params={{ threadId: String(thread.id) }}
            className="block"
            {...(longPressOpensMenu ? longPressHandlers : {})}
            onClick={handleThreadClick}
          >
            <div className="relative aspect-square bg-muted flex items-center justify-center">
              <img
                src={imageUrl}
                alt={displayTitle}
                loading="lazy"
                className={clsx(
                  "w-full h-full object-contain",
                  isNg && !ngRevealed && "blur-xl opacity-20",
                )}
                onError={(e: React.SyntheticEvent<HTMLImageElement>): void => {
                  (e.target as HTMLImageElement).src = noImage;
                }}
              />

              {isVideo && (!isNg || ngRevealed) && <VideoBadge />}
              {showCount && (!isNg || ngRevealed) && (
                <span className="absolute bottom-1 right-1 px-1.5 py-0.5 text-xs font-bold bg-black/70 text-white rounded">
                  {totalCount}
                </span>
              )}
              {showNew && isNew && (!isNg || ngRevealed) && (
                <span className="absolute top-1 left-1 px-1.5 py-0.5 text-xs font-bold bg-primary text-primary-foreground rounded">
                  NEW
                </span>
              )}
              {isNg && !ngRevealed && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/95">
                  <div className="flex flex-col items-center gap-2">
                    <div className="flex items-center gap-1 px-3 py-2 bg-destructive/90 text-destructive-foreground rounded text-sm font-bold">
                      <MdBlock size={16} />
                      <span>NG</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      タップで表示
                    </span>
                  </div>
                </div>
              )}
              {isNg && ngRevealed && (
                <>
                  <div className="absolute inset-0 bg-transparent cursor-pointer" />
                  <div className="absolute top-1 left-1 px-2 py-1 bg-destructive/90 text-destructive-foreground rounded text-xs font-bold flex items-center gap-1 pointer-events-none">
                    <MdBlock size={12} />
                    <span>NG</span>
                  </div>
                </>
              )}
            </div>
          </Link>
          <div className="flex items-start pt-2 px-2 mb-2">
            <Link
              to="/thread/$threadId"
              params={{ threadId: String(thread.id) }}
              className={clsx(
                "min-w-0 flex-1 text-xs text-muted-foreground line-clamp-2 leading-tight",
                "group-hover:text-foreground transition-colors",
                isNg && !ngRevealed && "blur-sm",
              )}
              {...(longPressOpensMenu ? longPressHandlers : {})}
              onClick={handleThreadClick}
            >
              {displayTitle}
            </Link>
            {isMenuButtonDisplayed && (
              <button
                type="button"
                onClick={handleMenuClick}
                className="flex-shrink-0 flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                aria-label="スレッドメニュー"
              >
                <HiOutlineDotsVertical className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        <ThreadContextMenu
          thread={thread}
          isOpen={menuOpen}
          onClose={(): void => setMenuOpen(false)}
        />
      </>
    );
  },
);
