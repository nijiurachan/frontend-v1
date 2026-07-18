import clsx from "clsx";
import {
  AnimatePresence,
  type MotionProps,
  motion,
  type PanInfo,
  useDragControls,
} from "motion/react";
import { type ReactNode, useContext, useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import { FiX } from "react-icons/fi";
import { ModalContext } from "./modal-context";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
  position?: "center" | "bottom" | "right";
  headerActions?: ReactNode;
  flickToClose?: boolean;
}

export const Modal: React.FunctionComponent<ModalProps> = ({
  isOpen,
  onClose,
  children,
  title,
  position = "center",
  headerActions,
  flickToClose = true,
}: ModalProps) => {
  const {
    registerModal,
    unregisterModal,
    registerCloseHandler,
    unregisterCloseHandler,
  } = useContext(ModalContext);
  const [depth, setDepth] = useState<number | null>(null);
  const titleId = useId();
  const dragControls = useDragControls(); // ドラッグ制御用

  // モーダルが開いたときに深さとcloseハンドラーを登録
  useEffect(() => {
    if (isOpen) {
      const modalDepth = registerModal();
      let disposed = false;
      queueMicrotask(() => {
        if (!disposed) setDepth(modalDepth);
      });
      registerCloseHandler(onClose);
      return (): void => {
        disposed = true;
        unregisterModal();
        unregisterCloseHandler(onClose);
        queueMicrotask(() => setDepth(null));
      };
    }
  }, [
    isOpen,
    registerModal,
    unregisterModal,
    registerCloseHandler,
    unregisterCloseHandler,
    onClose,
  ]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      return (): void => {
        document.body.style.overflow = "";
      };
    }
  }, [isOpen]);

  useEffect(() => {
    const handler = (e: KeyboardEvent): void => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) window.addEventListener("keydown", handler);
    return (): void => window.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  // 下フリックでモーダルを閉じる処理
  const handleDragEnd = (
    _event: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo,
  ): void => {
    // 下方向に100px以上ドラッグ、または速度が500以上の場合に閉じる
    if (info.offset.y > 100 || info.velocity.y > 500) {
      onClose();
    }
  };

  const getMotionProps = (): MotionProps => {
    switch (position) {
      case "bottom":
        return {
          initial: { opacity: 0, y: "100%" },
          animate: { opacity: 1, y: 0 },
          exit: { opacity: 0, y: "100%" },
        };
      case "right":
        return {
          initial: { opacity: 0, x: "100%" },
          animate: { opacity: 1, x: 0 },
          exit: { opacity: 0, x: "100%" },
        };
      default:
        return {
          initial: { opacity: 0, scale: 0.95 },
          animate: { opacity: 1, scale: 1 },
          exit: { opacity: 0, scale: 0.95 },
        };
    }
  };

  // ボトムモーダルでフリック閉じが有効な場合のドラッグ設定
  const getDragProps = (): MotionProps => {
    // position="bottom"かつflickToCloseがtrueのときのみ有効
    if (position === "bottom" && flickToClose) {
      return {
        drag: "y" as const, // y方向のみドラッグ可能
        dragConstraints: { top: 0, bottom: 0 }, // ドラッグ範囲を上下に制限
        dragElastic: { top: 0, bottom: 0.8 }, // 下部の弾力性を調整
        onDragEnd: handleDragEnd, // ドラッグ終了時の処理
        dragControls, // ドラッグ制御用
      };
    }
    return {};
  };

  // 深さに応じたz-indexを計算（各モーダルレベルで20ずつ増やす）
  const baseZIndex = 40;
  const zIndexOffset = (depth ?? 0) * 20;
  const backdropZIndex = baseZIndex + zIndexOffset;
  const modalZIndex = baseZIndex + 10 + zIndexOffset;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 bg-black/60"
            style={{ zIndex: backdropZIndex }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? titleId : undefined}
            aria-label={title ? undefined : "ダイアログ"}
            className={clsx(
              "fixed bg-card shadow-2xl",
              position === "center" &&
                "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-xl max-w-lg w-[calc(100%-2rem)] max-h-[85svh] overflow-hidden",
              position === "bottom" &&
                "bottom-0 left-0 right-0 rounded-t-2xl max-h-[85svh] overflow-hidden grid grid-flow-row grid-rows-[repeat(2,_max-content)_1fr]",
              position === "right" &&
                "top-0 right-0 bottom-0 w-80 max-w-full overflow-y-auto",
            )}
            style={{
              zIndex: modalZIndex,
              touchAction:
                position === "bottom" && flickToClose ? "none" : "auto",
            }}
            {...getMotionProps()}
            {...getDragProps()}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            {/* スワイプハンドル（ボトムモーダルでフリック閉じ有効時のみ表示） */}
            {position === "bottom" && flickToClose && (
              <div className="flex justify-center pt-2 pb-1 cursor-grab active:cursor-grabbing">
                <div className="w-10 h-1 bg-muted-foreground/30 rounded-full" />
              </div>
            )}
            {title && (
              <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <h2
                  id={titleId}
                  className="text-lg font-semibold text-foreground"
                >
                  {title}
                </h2>
                <div className="flex items-center gap-1">
                  {headerActions}
                  <button
                    type="button"
                    onClick={onClose}
                    aria-label="閉じる"
                    className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <FiX className="w-5 h-5" aria-hidden="true" />
                  </button>
                </div>
              </div>
            )}
            <div className="overflow-y-auto">{children}</div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body,
  );
};
