import clsx from "clsx";
import {
  type MotionProps,
  motion,
  type PanInfo,
  useDragControls,
  type Variants,
} from "motion/react";
import {
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { FiX } from "react-icons/fi";
import { ModalContext } from "./ModalContext";

export interface PersistentModalRenderProps {
  destroy: () => void;
}

interface PersistentModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode | ((props: PersistentModalRenderProps) => ReactNode);
  title?: ReactNode;
  position?: "center" | "bottom" | "right";
  headerActions?: ReactNode;
  flickToClose?: boolean;
  contentKey?: string | number;
}

export const PersistentModal: React.FunctionComponent<PersistentModalProps> = ({
  isOpen,
  onClose,
  children,
  title,
  position = "center",
  headerActions,
  flickToClose = true,
  contentKey,
}: PersistentModalProps) => {
  const {
    registerModal,
    unregisterModal,
    registerCloseHandler,
    unregisterCloseHandler,
  } = useContext(ModalContext);
  const [depth, setDepth] = useState<number | null>(null);
  const dragControls = useDragControls();

  // destroy(): childrenを完全にアンマウントしてから閉じる
  // 次回open時に自動でリセットされ、childrenはフレッシュにマウントされる
  const [isDestroyed, setIsDestroyed] = useState(false);

  const destroy = useCallback(() => {
    setIsDestroyed(true);
    onClose();
  }, [onClose]);

  // childrenがrender propの場合は{ destroy }を渡して解決
  const renderedChildren =
    typeof children === "function" ? children({ destroy }) : children;

  // 閉じアニメーション完了後に非表示にするためのstate
  // React推奨パターン: propsの変化に応じてレンダー中にstateを調整
  // https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes
  const [hasExited, setHasExited] = useState(!isOpen);
  if (isOpen && hasExited) {
    setHasExited(false);
  }
  // isOpen時にdestroyed状態をリセット（次回openでchildrenをフレッシュにマウント）
  if (isOpen && isDestroyed) {
    setIsDestroyed(false);
  }
  const isHidden = !isOpen && hasExited;

  // 閉じアニメーション完了時に非表示化
  const handleAnimationComplete = (definition: string): void => {
    if (definition === "closed") {
      setHasExited(true);
    }
  };

  // モーダルが開いたときに深さとcloseハンドラーを登録
  useEffect(() => {
    if (isOpen) {
      const modalDepth = registerModal();
      setDepth(modalDepth);
      registerCloseHandler(onClose);
      return (): void => {
        unregisterModal();
        unregisterCloseHandler(onClose);
        setDepth(null);
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
    if (info.offset.y > 100 || info.velocity.y > 500) {
      onClose();
    }
  };

  const getVariants = (): Variants => {
    switch (position) {
      case "bottom":
        return {
          open: { opacity: 1, y: 0 },
          closed: { opacity: 0, y: "100%" },
        };
      case "right":
        return {
          open: { opacity: 1, x: 0 },
          closed: { opacity: 0, x: "100%" },
        };
      default:
        return {
          open: { opacity: 1, scale: 1 },
          closed: { opacity: 0, scale: 0.95 },
        };
    }
  };

  // ボトムモーダルでフリック閉じが有効な場合のドラッグ設定
  const getDragProps = (): MotionProps => {
    if (position === "bottom" && flickToClose) {
      return {
        drag: "y" as const,
        dragConstraints: { top: 0, bottom: 0 },
        dragElastic: { top: 0, bottom: 0.8 },
        onDragEnd: handleDragEnd,
        dragControls,
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
    <>
      {/* バックドロップ: 常時レンダリング、アニメーションで表示/非表示 */}
      <motion.div
        className="fixed inset-0 bg-black/60"
        aria-hidden={!isOpen}
        style={{
          zIndex: backdropZIndex,
          visibility: isHidden ? "hidden" : "visible",
          pointerEvents: isOpen ? "auto" : "none",
        }}
        initial={false}
        animate={isOpen ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: 0.15 }}
        onClick={onClose}
      />
      {/* モーダルパネル: 常時レンダリング、childrenの状態を保持 */}
      <motion.div
        aria-hidden={!isOpen}
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
          touchAction: position === "bottom" && flickToClose ? "none" : "auto",
          visibility: isHidden ? "hidden" : "visible",
          pointerEvents: isOpen ? "auto" : "none",
        }}
        initial={false}
        animate={isOpen ? "open" : "closed"}
        variants={getVariants()}
        onAnimationComplete={handleAnimationComplete}
        {...getDragProps()}
        transition={{ duration: 0.2, ease: "easeOut" }}
      >
        {/* スワイプハンドル（ボトムモーダルでフリック閉じ有効時のみ表示） */}
        {position === "bottom" && flickToClose && (
          <div className="flex justify-center pt-2 pb-1 cursor-grab active:cursor-grabbing">
            <div className="w-10 h-1 bg-muted-foreground/30 rounded-full" />
          </div>
        )}
        {title != null && (
          <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-border min-w-0">
            {typeof title === "string" ? (
              <h2 className="text-lg font-semibold text-foreground">{title}</h2>
            ) : (
              <div className="min-w-0 flex-1">{title}</div>
            )}
            <div className="flex items-center gap-1 shrink-0">
              {headerActions}
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
        <div key={contentKey} className="overflow-y-auto">
          {!isDestroyed && renderedChildren}
        </div>
      </motion.div>
    </>,
    document.body,
  );
};
