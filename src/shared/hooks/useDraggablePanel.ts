import { type CSSProperties, type RefObject, useRef, useState } from "react";

interface PanelPosition {
  left: number;
  top: number;
}

interface DragHandleProps {
  onPointerDown: (event: React.PointerEvent<HTMLElement>) => void;
  onPointerMove: (event: React.PointerEvent<HTMLElement>) => void;
  onPointerUp: (event: React.PointerEvent<HTMLElement>) => void;
  onPointerCancel: (event: React.PointerEvent<HTMLElement>) => void;
}

interface UseDraggablePanelResult {
  panelRef: RefObject<HTMLElement | null>;
  /** 一度でも動かしたら fixed 位置を left/top 指定へ切り替える */
  panelStyle: CSSProperties | undefined;
  /** タイトルバーなどドラッグハンドルへ渡す */
  handleProps: DragHandleProps;
}

/** ドラッグ後のパネル位置を画面内へ収める。 */
export function clampPanelPosition(
  left: number,
  top: number,
  panelWidth: number,
  viewportWidth: number,
  viewportHeight: number,
): PanelPosition {
  // 掴み直せるだけの領域 (ハンドル約40px) は必ず画面内に残す
  const minVisible = 40;
  return {
    left: Math.min(
      Math.max(left, minVisible - panelWidth),
      viewportWidth - minVisible,
    ),
    top: Math.min(Math.max(top, 0), viewportHeight - minVisible),
  };
}

/**
 * 旧PC版のフローティングフォームをタイトルバーのドラッグで移動できるようにする。
 * 初期位置はCSS (top/right) のまま、移動した時点で left/top 指定へ切り替える。
 * 位置はコンポーネントの寿命の間だけ保持する (リロードで既定位置へ戻る)。
 */
export function useDraggablePanel(): UseDraggablePanelResult {
  const panelRef = useRef<HTMLElement | null>(null);
  const [position, setPosition] = useState<PanelPosition | null>(null);
  const dragStateRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    baseLeft: number;
    baseTop: number;
    panelWidth: number;
  } | null>(null);

  const onPointerDown = (event: React.PointerEvent<HTMLElement>): void => {
    if (event.button !== 0) return;
    const panel = panelRef.current;
    if (!panel) return;
    const rect = panel.getBoundingClientRect();
    dragStateRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      baseLeft: rect.left,
      baseTop: rect.top,
      panelWidth: rect.width,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
    // ドラッグ中のテキスト選択を防ぐ
    event.preventDefault();
  };

  const onPointerMove = (event: React.PointerEvent<HTMLElement>): void => {
    const dragState = dragStateRef.current;
    if (!dragState || dragState.pointerId !== event.pointerId) return;
    setPosition(
      clampPanelPosition(
        dragState.baseLeft + event.clientX - dragState.startX,
        dragState.baseTop + event.clientY - dragState.startY,
        dragState.panelWidth,
        window.innerWidth,
        window.innerHeight,
      ),
    );
  };

  const endDrag = (event: React.PointerEvent<HTMLElement>): void => {
    if (dragStateRef.current?.pointerId !== event.pointerId) return;
    dragStateRef.current = null;
  };

  return {
    panelRef,
    panelStyle: position
      ? { left: position.left, top: position.top, right: "auto" }
      : undefined,
    handleProps: {
      onPointerDown,
      onPointerMove,
      onPointerUp: endDrag,
      onPointerCancel: endDrag,
    },
  };
}
