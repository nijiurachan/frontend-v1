import { Link } from "@tanstack/react-router";
import clsx from "clsx";
import { memo, type RefObject, useState } from "react";
import { HiOutlineDotsVertical } from "react-icons/hi";
import { MdBlock } from "react-icons/md";
import noImage from "@/assets/img/no-image.svg";
import type { Thread } from "@/entities/thread";
import { getImageUrl, getThreadTitle } from "@/entities/thread";
import { ThreadContextMenu } from "@/features/catalog/components/actions/ThreadContextMenu";
import { useCatalogStore } from "@/features/catalog/stores/catalogStore";
import { useHistoryStore } from "@/features/history/stores/historyStore";
import { useNgStore } from "@/features/ng-filter/stores";
import { useSettingsStore } from "@/features/settings/hooks";
import { isVideoAttachment } from "@/shared/lib";
import { useAimogeBeforeRender, useAimogeRendered } from "@/shared/lib/aimoge";
import { TagBadges } from "@/shared/ui/navigation";

interface Props {
  thread: Thread;
  isNew: boolean;
}

/** 旧カタログの1セル。モバイルのCatalogItemとはDOM/寸法を分離する。 */
export const DesktopCatalogItem: React.FunctionComponent<Props> = memo(
  function DesktopCatalogItem(props: Props) {
    const renderedThread = useAimogeBeforeRender(
      "catalog:beforeRender",
      props.thread,
    );
    const elementRef = useAimogeRendered(
      "catalog",
      renderedThread,
      renderedThread?.id,
    );

    if (!renderedThread) return null;
    return (
      <DesktopCatalogItemContent
        thread={renderedThread}
        isNew={props.isNew}
        elementRef={elementRef}
      />
    );
  },
);

interface ContentProps extends Props {
  elementRef: RefObject<HTMLDivElement | null>;
}

const DesktopCatalogItemContent: React.FunctionComponent<ContentProps> = memo(
  function DesktopCatalogItemContent({
    thread,
    isNew,
    elementRef,
  }: ContentProps) {
    const showNew = useCatalogStore((state) => state.showNew);
    const showCount = useCatalogStore((state) => state.showCount);
    const showUnreadCount = useCatalogStore((state) => state.showUnreadCount);
    const textLength = useCatalogStore((state) => state.textLength);
    const textPosition = useCatalogStore((state) => state.textPosition);
    const imageSize = useCatalogStore((state) => state.imageSize);
    const openInNewTab = useCatalogStore((state) => state.openInNewTab);
    const catalogAnim = useCatalogStore((state) => state.catalogAnim);
    const showR18 = useSettingsStore((state) => state.showR18);
    const { addViewed, getUnreadCount } = useHistoryStore();
    const { isThreadHidden, showNgContent } = useNgStore();
    const [menuOpen, setMenuOpen] = useState(false);
    const [revealed, setRevealed] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const title = getThreadTitle(thread, textLength);
    const isNg = showNgContent && isThreadHidden(thread);
    const isR18 = thread.tags.some((tag) => tag.name === "R18");
    const isMasked = (isNg || (isR18 && !showR18)) && !revealed;
    const unreadCount = getUnreadCount(thread.id, thread.replyCount) ?? 0;
    const imageUrl = getImageUrl(
      thread.opPost.attachment,
      (catalogAnim === "always" || (catalogAnim === "hover" && isHovered)) &&
        thread.opPost.attachment?.kind === "animated",
    );
    const isVideo = thread.opPost.attachment
      ? isVideoAttachment(thread.opPost.attachment)
      : false;

    const handleClick = (event: React.MouseEvent): void => {
      if (isMasked) {
        event.preventDefault();
        event.stopPropagation();
        setRevealed(true);
        return;
      }
      addViewed(thread.id);
    };

    return (
      <div
        ref={elementRef}
        className={clsx(
          "desktop-catalog-item",
          textPosition === "right" && "desktop-catalog-item-right",
        )}
        style={
          {
            "--catalog-image-size": `${imageSize}px`,
          } as React.CSSProperties
        }
      >
        <Link
          to="/thread/$threadId"
          params={{ threadId: thread.id }}
          onClick={handleClick}
          target={openInNewTab ? "_blank" : undefined}
          rel={openInNewTab ? "noopener noreferrer" : undefined}
          onMouseEnter={(): void => setIsHovered(true)}
          onMouseLeave={(): void => setIsHovered(false)}
          onFocus={(): void => setIsHovered(true)}
          onBlur={(): void => setIsHovered(false)}
        >
          <div className="desktop-catalog-thumb">
            <img
              src={imageUrl}
              alt={title}
              loading="lazy"
              decoding="async"
              onError={(
                event: React.SyntheticEvent<HTMLImageElement>,
              ): void => {
                event.currentTarget.src = noImage;
              }}
            />
            {isMasked && (
              <div className="desktop-r18-mask">
                <MdBlock size={16} /> {isR18 ? "R18" : "NG"}
              </div>
            )}
            {isVideo && !isMasked && (
              <span className="absolute top-1 left-1 bg-black/70 px-1 text-xs text-white">
                動画
              </span>
            )}
            {showNew && isNew && !isMasked && (
              <span className="absolute top-1 right-1 bg-[#0040e0] px-1 text-xs text-white">
                NEW
              </span>
            )}
          </div>
          {textLength > 0 && (
            <div
              className={clsx("desktop-catalog-text", isMasked && "blur-sm")}
            >
              {title}
            </div>
          )}
          <div className={clsx("desktop-catalog-count", isMasked && "blur-sm")}>
            {showCount && thread.replyCount}
            {showUnreadCount && unreadCount > 0 && (
              <span className="ml-1 text-xs text-[#0040e0]">
                +{unreadCount}
              </span>
            )}
          </div>
        </Link>
        <TagBadges tags={thread.tags} className="px-1 pb-1" />
        <button
          type="button"
          className="desktop-catalog-menu"
          aria-label="スレッドメニュー"
          onClick={(): void => setMenuOpen(true)}
        >
          <HiOutlineDotsVertical size={14} />
        </button>
        <ThreadContextMenu
          thread={thread}
          isOpen={menuOpen}
          onClose={(): void => setMenuOpen(false)}
        />
      </div>
    );
  },
);
