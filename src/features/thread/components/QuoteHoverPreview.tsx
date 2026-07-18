import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { Post } from "@/entities/post";
import { useIsDesktop } from "@/shared/hooks";
import {
  clearQuotePreviewCloseTimer,
  getQuotePreviewMode,
} from "../utils/quoteHoverPreview";

interface Props {
  target: Post | null;
  onJumpToPost?: (postSeq: number) => void;
  children: React.ReactNode;
}

/** PC幅だけで引用元をホバー表示する。モバイルは子要素の既存タップ処理を使う。 */
export const QuoteHoverPreview: React.FunctionComponent<Props> = ({
  target,
  onJumpToPost,
  children,
}: Props) => {
  const isDesktop = useIsDesktop();
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ left: 0, top: 0 });
  const anchorRef = useRef<HTMLSpanElement>(null);
  const closeTimerRef = useRef<number | null>(null);
  const previewMode = getQuotePreviewMode(target, Boolean(onJumpToPost));

  const cancelClose = (): void => {
    clearQuotePreviewCloseTimer(closeTimerRef, window.clearTimeout);
  };

  const scheduleClose = (): void => {
    cancelClose();
    closeTimerRef.current = window.setTimeout(() => setIsOpen(false), 150);
  };

  useEffect(() => {
    if (!isOpen) return;
    const updatePosition = (): void => {
      const rect = anchorRef.current?.getBoundingClientRect();
      if (rect) setPosition({ left: rect.left, top: rect.bottom + 4 });
    };
    updatePosition();
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);
    return (): void => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [isOpen]);

  useEffect(
    () => (): void =>
      clearQuotePreviewCloseTimer(closeTimerRef, window.clearTimeout),
    [],
  );

  if (!isDesktop || !target || previewMode === "hidden") {
    return <>{children}</>;
  }

  const previewContent = (
    <>
      <span className="quote-preview-number">No.{target.seq}</span>
      <span className="quote-preview-body">
        {target.body || "（本文なし）"}
      </span>
    </>
  );

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: hover-only preview anchor
    <span
      ref={anchorRef}
      className="quote-preview-anchor"
      onMouseEnter={(): void => {
        cancelClose();
        setIsOpen(true);
      }}
      onMouseLeave={scheduleClose}
    >
      {children}
      {isOpen && typeof document !== "undefined"
        ? createPortal(
            previewMode === "interactive" && onJumpToPost ? (
              <button
                type="button"
                className="quote-preview-popup"
                style={{ left: position.left, top: position.top }}
                onMouseEnter={cancelClose}
                onMouseLeave={scheduleClose}
                onClick={(): void => onJumpToPost(target.seq)}
                aria-label={`No.${target.seq}へ移動`}
              >
                {previewContent}
                <span className="quote-preview-hint">
                  引用行は返信に引用・プレビューはレスへ移動
                </span>
              </button>
            ) : (
              // biome-ignore lint/a11y/noStaticElementInteractions: hover preview stays open while pointer is over it
              <div
                className="quote-preview-popup"
                style={{ left: position.left, top: position.top }}
                onMouseEnter={cancelClose}
                onMouseLeave={scheduleClose}
              >
                {previewContent}
              </div>
            ),
            document.body,
          )
        : null}
    </span>
  );
};
