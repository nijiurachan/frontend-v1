import { useCallback, useEffect, useRef } from "react";

interface Options {
  /** クロール全体の高さ（px）。`sceneHeight + contentHeight` を渡す */
  totalDistance: number;
  /** 1 秒あたりのピクセル移動量 */
  pxPerSecond: number;
  /** シーク操作後に自動再生を再開するまでの待ち時間（ms） */
  resumeAfterMs?: number;
}

export interface CrawlProgressApi {
  /** CSS 変数 `--sw-progress-px` を設定する対象要素。`ref` として渡す */
  ref: React.RefObject<HTMLDivElement | null>;
  /** wheel イベントハンドラ */
  onWheel: (e: React.WheelEvent<HTMLDivElement>) => void;
  /** touch イベントハンドラ */
  onTouchStart: (e: React.TouchEvent<HTMLDivElement>) => void;
  onTouchMove: (e: React.TouchEvent<HTMLDivElement>) => void;
  onTouchEnd: () => void;
  /** OS によるジェスチャキャンセル時のハンドラ（`onTouchEnd` と同じクリーンアップを行う） */
  onTouchCancel: () => void;
}

export function useCrawlProgress({
  totalDistance,
  pxPerSecond,
  resumeAfterMs = 1500,
}: Options): CrawlProgressApi {
  const ref = useRef<HTMLDivElement | null>(null);
  const progressPxRef = useRef<number>(0);
  const isSeekingRef = useRef<boolean>(false);
  const lastInteractionRef = useRef<number>(0);
  const touchYRef = useRef<number | null>(null);
  const touchIdRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);
  const prevTsRef = useRef<number | null>(null);

  // チューナブルな値を ref に保持し、親からの再計算で RAF ループが
  // 再セットアップされないようにする
  const totalDistanceRef = useRef(totalDistance);
  const pxPerSecondRef = useRef(pxPerSecond);
  const resumeAfterMsRef = useRef(resumeAfterMs);

  useEffect(() => {
    totalDistanceRef.current = totalDistance;
    pxPerSecondRef.current = pxPerSecond;
    resumeAfterMsRef.current = resumeAfterMs;
  }, [totalDistance, pxPerSecond, resumeAfterMs]);

  // 現在値を DOM に反映（ref しか参照しないので `[]` で安定させる）
  const apply = useCallback((): void => {
    const clamped = Math.max(
      0,
      Math.min(totalDistanceRef.current, progressPxRef.current),
    );
    progressPxRef.current = clamped;
    if (ref.current) {
      ref.current.style.setProperty("--sw-progress-px", `${clamped}px`);
    }
  }, []);

  useEffect(() => {
    const tick = (ts: number): void => {
      if (prevTsRef.current === null) {
        prevTsRef.current = ts;
      }
      const dt = (ts - prevTsRef.current) / 1000;
      prevTsRef.current = ts;

      const idleMs = performance.now() - lastInteractionRef.current;
      const canAutoplay =
        !isSeekingRef.current &&
        (lastInteractionRef.current === 0 ||
          idleMs > resumeAfterMsRef.current) &&
        progressPxRef.current < totalDistanceRef.current;

      if (canAutoplay) {
        progressPxRef.current += pxPerSecondRef.current * dt;
        apply();
      }

      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return (): void => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      prevTsRef.current = null;
    };
  }, [apply]);

  const bumpInteraction = (): void => {
    lastInteractionRef.current = performance.now();
  };

  const onWheel = (e: React.WheelEvent<HTMLDivElement>): void => {
    progressPxRef.current += e.deltaY;
    apply();
    bumpInteraction();
  };

  const onTouchStart = (e: React.TouchEvent<HTMLDivElement>): void => {
    isSeekingRef.current = true;
    const t = e.touches[0];
    touchIdRef.current = t?.identifier ?? null;
    touchYRef.current = t?.clientY ?? null;
    bumpInteraction();
  };

  const onTouchMove = (e: React.TouchEvent<HTMLDivElement>): void => {
    if (touchIdRef.current === null || touchYRef.current === null) return;
    const tracked = Array.from(e.touches).find(
      (t) => t.identifier === touchIdRef.current,
    );
    if (!tracked) return;
    const y = tracked.clientY;
    const dy = touchYRef.current - y;
    progressPxRef.current += dy;
    touchYRef.current = y;
    apply();
    bumpInteraction();
  };

  const onTouchEnd = (): void => {
    isSeekingRef.current = false;
    touchYRef.current = null;
    touchIdRef.current = null;
    bumpInteraction();
  };

  return {
    ref,
    onWheel,
    onTouchStart,
    onTouchMove,
    onTouchEnd,
    onTouchCancel: onTouchEnd,
  };
}
