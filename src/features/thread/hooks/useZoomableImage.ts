import {
  type MouseEvent,
  type PointerEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
  type WheelEvent,
} from "react";
import { clamp, distance2d, type Point2D } from "@/shared/lib";

type BaseRect = {
  left: number;
  top: number;
  width: number;
  height: number;
};

type TransformState = {
  scale: number;
  tx: number;
  ty: number;
};

type PanState = {
  pointerId: number;
  startX: number;
  startY: number;
  startTx: number;
  startTy: number;
};

type PinchState = {
  pointerIds: [number, number];
  prevDist: number;
};

type LastTapState = {
  time: number;
  x: number;
  y: number;
};

type ZoomableImageStateRef = {
  geometry: {
    baseRect: BaseRect | null;
    transform: TransformState;
  };
  gesture: {
    pointers: Map<number, Point2D>;
    pan: PanState | null;
    pinch: PinchState | null;
    lastTap: LastTapState | null;
  };
  misc: {
    suppressClick: boolean;
    resizeRaf: number | null;
  };
};

export type UseZoomableImageOptions = {
  minScale: number;
  maxScale: number;
};

export interface ZoomableImageState {
  imgRef: React.RefObject<HTMLImageElement | null>;
  transform: TransformState;
  isZoomed: boolean;
  interactionProps: {
    onClickCapture: (e: MouseEvent<HTMLDivElement>) => void;
    onDoubleClick: (e: MouseEvent<HTMLDivElement>) => void;
    onWheel: (e: WheelEvent<HTMLDivElement>) => void;
    onPointerDown: (e: PointerEvent<HTMLDivElement>) => void;
    onPointerMove: (e: PointerEvent<HTMLDivElement>) => void;
    onPointerUp: (e: PointerEvent<HTMLDivElement>) => void;
    onPointerCancel: (e: PointerEvent<HTMLDivElement>) => void;
  };
  onImageLoad: () => void;
}

export function useZoomableImage({
  minScale,
  maxScale,
}: UseZoomableImageOptions): ZoomableImageState {
  const imgRef = useRef<HTMLImageElement>(null);

  const stateRef = useRef<ZoomableImageStateRef>({
    geometry: {
      baseRect: null,
      transform: { scale: 1, tx: 0, ty: 0 },
    },
    gesture: {
      pointers: new Map<number, Point2D>(),
      pan: null,
      pinch: null,
      lastTap: null,
    },
    misc: {
      suppressClick: false,
      resizeRaf: null,
    },
  });

  const [transform, setTransformState] = useState<TransformState>({
    scale: 1,
    tx: 0,
    ty: 0,
  });

  const isZoomed = transform.scale > 1.0001;

  const recordBaseRect = useCallback((): void => {
    const img = imgRef.current;
    if (!img) return;
    const rect = img.getBoundingClientRect();
    const { geometry } = stateRef.current;
    geometry.baseRect = {
      left: rect.left,
      top: rect.top,
      width: rect.width || 1,
      height: rect.height || 1,
    };
  }, []);

  const setTransform = useCallback(
    (next: TransformState): void => {
      const normalized: TransformState = {
        scale: clamp(next.scale, minScale, maxScale),
        tx: next.tx,
        ty: next.ty,
      };

      if (normalized.scale <= 1) {
        normalized.scale = 1;
        normalized.tx = 0;
        normalized.ty = 0;
      }

      const { geometry } = stateRef.current;

      const prev = geometry.transform;
      if (
        prev.scale === normalized.scale &&
        prev.tx === normalized.tx &&
        prev.ty === normalized.ty
      ) {
        return;
      }

      geometry.transform = normalized;
      setTransformState(normalized);
    },
    [maxScale, minScale],
  );

  const zoomAtPoint = useCallback(
    (nextScale: number, clientX: number, clientY: number): void => {
      const { geometry } = stateRef.current;

      const base = geometry.baseRect;
      if (!base) {
        recordBaseRect();
      }

      const currentBase = geometry.baseRect;
      if (!currentBase) return;

      const prev = geometry.transform;
      const prevScale = prev.scale;
      const clampedScale = clamp(nextScale, minScale, maxScale);

      if (clampedScale <= 1) {
        setTransform({ scale: 1, tx: 0, ty: 0 });
        return;
      }

      const ratio = clampedScale / prevScale;
      const nextTx =
        prev.tx + (clientX - currentBase.left - prev.tx) * (1 - ratio);
      const nextTy =
        prev.ty + (clientY - currentBase.top - prev.ty) * (1 - ratio);

      setTransform({ scale: clampedScale, tx: nextTx, ty: nextTy });
    },
    [maxScale, minScale, recordBaseRect, setTransform],
  );

  const toggleZoomAtPoint = useCallback(
    (clientX: number, clientY: number): void => {
      const { geometry } = stateRef.current;
      const next = geometry.transform.scale <= 1 ? 2 : 1;
      zoomAtPoint(next, clientX, clientY);
    },
    [zoomAtPoint],
  );

  useEffect(() => {
    const state = stateRef.current;

    const handleResize = (): void => {
      const { geometry, misc } = state;
      const rafId = misc.resizeRaf;
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }

      // レイアウトが変わったときに、変形済みの rect を基準にするとズレやすいので
      // 手堅く等倍に戻してからベース矩形を再取得する。
      setTransform({ scale: 1, tx: 0, ty: 0 });
      geometry.baseRect = null;

      misc.resizeRaf = requestAnimationFrame(() => {
        recordBaseRect();
        misc.resizeRaf = null;
      });
    };

    window.addEventListener("resize", handleResize);
    return (): void => {
      window.removeEventListener("resize", handleResize);
      const { misc } = state;
      const rafId = misc.resizeRaf;
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }
    };
  }, [recordBaseRect, setTransform]);

  const onWheel = useCallback(
    (e: WheelEvent<HTMLDivElement>): void => {
      e.stopPropagation();

      const { geometry } = stateRef.current;
      const delta = e.deltaY;
      const factor = delta > 0 ? 0.9 : 1.1;
      const nextScale = clamp(
        geometry.transform.scale * factor,
        minScale,
        maxScale,
      );
      zoomAtPoint(nextScale, e.clientX, e.clientY);
    },
    [maxScale, minScale, zoomAtPoint],
  );

  const onDoubleClick = useCallback(
    (e: MouseEvent<HTMLDivElement>): void => {
      e.stopPropagation();
      toggleZoomAtPoint(e.clientX, e.clientY);
    },
    [toggleZoomAtPoint],
  );

  const onPointerDown = useCallback(
    (e: PointerEvent<HTMLDivElement>): void => {
      const { geometry, gesture, misc } = stateRef.current;
      if (e.pointerType === "mouse" && e.button !== 0) return;

      // 等倍表示のときは、ブラウザのネイティブ画像ドラッグ（他アプリへのD&D等）を優先する
      if (e.pointerType === "mouse" && geometry.transform.scale <= 1) {
        return;
      }

      e.currentTarget.setPointerCapture(e.pointerId);
      gesture.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

      misc.suppressClick = false;

      const pointers = Array.from(gesture.pointers.entries());
      if (pointers.length === 1) {
        gesture.pan = {
          pointerId: e.pointerId,
          startX: e.clientX,
          startY: e.clientY,
          startTx: geometry.transform.tx,
          startTy: geometry.transform.ty,
        };
      }

      if (pointers.length === 2) {
        const [p1, p2] = pointers;
        gesture.pinch = {
          pointerIds: [p1[0], p2[0]],
          prevDist: distance2d(p1[1], p2[1]) || 1,
        };
        gesture.pan = null;
      }

      if (e.pointerType === "touch") {
        const now = Date.now();
        const last = gesture.lastTap;
        if (last) {
          const dt = now - last.time;
          const dx = e.clientX - last.x;
          const dy = e.clientY - last.y;
          const moved = Math.hypot(dx, dy);
          if (dt < 300 && moved < 24) {
            gesture.lastTap = null;
            gesture.pan = null;
            toggleZoomAtPoint(e.clientX, e.clientY);
            e.stopPropagation();
            return;
          }
        }
        gesture.lastTap = { time: now, x: e.clientX, y: e.clientY };
      }
    },
    [toggleZoomAtPoint],
  );

  const onPointerMove = useCallback(
    (e: PointerEvent<HTMLDivElement>): void => {
      const { geometry, gesture, misc } = stateRef.current;
      if (!gesture.pointers.has(e.pointerId)) return;

      gesture.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

      const pan = gesture.pan;
      if (pan && pan.pointerId === e.pointerId) {
        const moved = Math.hypot(
          e.clientX - pan.startX,
          e.clientY - pan.startY,
        );
        if (moved > 6) misc.suppressClick = true;
      }

      const pinch = gesture.pinch;
      if (pinch) {
        const [id1, id2] = pinch.pointerIds;
        const p1 = gesture.pointers.get(id1);
        const p2 = gesture.pointers.get(id2);
        if (!p1 || !p2) return;

        const dist = distance2d(p1, p2);
        const ratio = dist / (pinch.prevDist || 1);
        pinch.prevDist = dist || 1;

        const current = geometry.transform;
        const nextScale = clamp(current.scale * ratio, minScale, maxScale);
        const cx = (p1.x + p2.x) / 2;
        const cy = (p1.y + p2.y) / 2;
        zoomAtPoint(nextScale, cx, cy);
        return;
      }

      if (!pan) return;
      if (pan.pointerId !== e.pointerId) return;
      if (geometry.transform.scale <= 1) return;

      const dx = e.clientX - pan.startX;
      const dy = e.clientY - pan.startY;
      setTransform({
        scale: geometry.transform.scale,
        tx: pan.startTx + dx,
        ty: pan.startTy + dy,
      });
    },
    [maxScale, minScale, setTransform, zoomAtPoint],
  );

  const onPointerUpOrCancel = useCallback(
    (e: PointerEvent<HTMLDivElement>): void => {
      const { geometry, gesture } = stateRef.current;
      gesture.pointers.delete(e.pointerId);

      const pinch = gesture.pinch;
      if (pinch) {
        const [id1, id2] = pinch.pointerIds;
        if (e.pointerId === id1 || e.pointerId === id2) {
          gesture.pinch = null;
        }
      }

      const pan = gesture.pan;
      if (pan && pan.pointerId === e.pointerId) {
        gesture.pan = null;
      }

      const remaining = Array.from(gesture.pointers.entries());
      if (remaining.length === 1) {
        const [only] = remaining;
        gesture.pan = {
          pointerId: only[0],
          startX: only[1].x,
          startY: only[1].y,
          startTx: geometry.transform.tx,
          startTy: geometry.transform.ty,
        };
      }

      setTransform(geometry.transform);
    },
    [setTransform],
  );

  const isImageHit = useCallback(
    (clientX: number, clientY: number): boolean => {
      const img = imgRef.current;
      if (!img) return false;
      const hit = document.elementFromPoint(clientX, clientY);
      if (!hit) return false;
      return hit === img || hit.closest("img") === img;
    },
    [],
  );

  const onClickCapture = useCallback(
    (e: MouseEvent<HTMLDivElement>): void => {
      const { misc } = stateRef.current;
      // pointer capture により target が全面レイヤーになるため、座標で判定する
      if (misc.suppressClick) {
        e.stopPropagation();
        misc.suppressClick = false;
        return;
      }

      if (isImageHit(e.clientX, e.clientY)) {
        e.stopPropagation();
      }
    },
    [isImageHit],
  );

  const onImageLoad = useCallback((): void => {
    recordBaseRect();
  }, [recordBaseRect]);

  return {
    imgRef,
    transform,
    isZoomed,
    interactionProps: {
      onClickCapture,
      onDoubleClick,
      onWheel,
      onPointerDown,
      onPointerMove,
      onPointerUp: onPointerUpOrCancel,
      onPointerCancel: onPointerUpOrCancel,
    },
    onImageLoad,
  };
}
