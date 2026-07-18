import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { type Post, postNo } from "@/entities/post";
import {
  clearQuotePreviewCloseTimer,
  getQuotePreviewMode,
} from "@/features/thread/utils/quoteHoverPreview";
import { useIsDesktop } from "@/shared/hooks";

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

  const handleKeyDown = (event: React.KeyboardEvent<HTMLSpanElement>): void => {
    if (
      event.target === event.currentTarget &&
      event.key === "Enter" &&
      previewMode === "interactive" &&
      onJumpToPost &&
      target
    ) {
      event.preventDefault();
      onJumpToPost(target.seq);
    }
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
      <span className="quote-preview-number">No.{postNo(target)}</span>
      <span className="quote-preview-body">
        {target.body || "（本文なし）"}
      </span>
    </>
  );

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions lint/a11y/useAriaPropsSupportedByRole: interactive mode conditionally supplies link semantics; a native anchor cannot wrap child links
    <span
      ref={anchorRef}
      className="quote-preview-anchor"
      role={previewMode === "interactive" ? "link" : undefined}
      tabIndex={previewMode === "interactive" ? 0 : undefined}
      aria-label={
        previewMode === "interactive" ? `No.${postNo(target)}へ移動` : undefined
      }
      onMouseEnter={(): void => {
        cancelClose();
        setIsOpen(true);
      }}
      onMouseLeave={scheduleClose}
      onFocus={(): void => {
        cancelClose();
        setIsOpen(true);
      }}
      onBlur={scheduleClose}
      onKeyDown={handleKeyDown}
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
                onFocus={cancelClose}
                onBlur={scheduleClose}
                onClick={(): void => onJumpToPost(target.seq)}
                aria-label={`No.${postNo(target)}へ移動`}
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
