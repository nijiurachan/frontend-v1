import type { MouseEvent, TouchEvent } from "react";
import { useCallback, useRef } from "react";

export interface UseLongPressOptions {
  threshold?: number;
  onLongPress: () => void;
  onPress?: () => void;
}

export interface LongPressHandlers {
  onTouchStart: (e: TouchEvent | MouseEvent) => void;
  onTouchMove: (e: TouchEvent | MouseEvent) => void;
  onTouchEnd: () => void;
  onMouseDown: (e: TouchEvent | MouseEvent) => void;
  onMouseMove: (e: TouchEvent | MouseEvent) => void;
  onMouseUp: () => void;
}

export function useLongPress({
  threshold = 500,
  onLongPress,
  onPress,
}: UseLongPressOptions): LongPressHandlers {
  const timerRef = useRef<number | null>(null);
  const isLongPressRef = useRef(false);
  const startPosRef = useRef({ x: 0, y: 0 });

  const start = useCallback(
    (e: TouchEvent | MouseEvent): void => {
      const pos = "touches" in e ? e.touches[0] : e;
      startPosRef.current = { x: pos.clientX, y: pos.clientY };
      isLongPressRef.current = false;

      timerRef.current = window.setTimeout(() => {
        isLongPressRef.current = true;
        navigator.vibrate?.(30);
        onLongPress();
      }, threshold);
    },
    [threshold, onLongPress],
  );

  const move = useCallback((e: TouchEvent | MouseEvent): void => {
    if (!timerRef.current) return;
    const pos = "touches" in e ? e.touches[0] : e;
    const dx = Math.abs(pos.clientX - startPosRef.current.x);
    const dy = Math.abs(pos.clientY - startPosRef.current.y);
    if (dx > 10 || dy > 10) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const end = useCallback((): void => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
      if (!isLongPressRef.current) onPress?.();
    }
  }, [onPress]);

  return {
    onTouchStart: start,
    onTouchMove: move,
    onTouchEnd: end,
    onMouseDown: start,
    onMouseMove: move,
    onMouseUp: end,
  };
}
