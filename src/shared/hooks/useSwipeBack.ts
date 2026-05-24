import { type RefObject, useEffect, useRef } from "react";

const EDGE_THRESHOLD = 50;
// 速度閾値 (px/ms)。0.4px/msは一般的なフリック判定の目安
const VELOCITY_THRESHOLD = 0.4;
const VERTICAL_TOLERANCE = 0.7;
const VERTICAL_BAILOUT = 16;
const RELEASE_TRANSITION = "transform 220ms cubic-bezier(0.22, 1, 0.36, 1)";
const RELEASE_DURATION_MS = 220;

function isAnyModalOpen(): boolean {
  return document.body.style.overflow === "hidden";
}

const isPwa: boolean =
  typeof window !== "undefined" &&
  (window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as { standalone?: boolean }).standalone === true);

export function useSwipeBack(
  onBack: () => void,
  contentRef?: RefObject<HTMLElement | null>,
): void {
  const callbackRef = useRef(onBack);
  const contentRefRef = useRef(contentRef);

  useEffect(() => {
    callbackRef.current = onBack;
  }, [onBack]);

  useEffect(() => {
    contentRefRef.current = contentRef;
  }, [contentRef]);

  useEffect(() => {
    // PWA（ホーム画面から起動）以外ではブラウザの戻る機能があるため無効化
    if (!isPwa) return;
    let startX = 0;
    let startY = 0;
    let lastX = 0;
    let lastTime = 0;
    let velocityX = 0;
    let armed = false;
    let triggered = false;
    let dragging = false;
    let releaseTimer: ReturnType<typeof setTimeout> | null = null;

    function getEl(): HTMLElement | null {
      return contentRefRef.current?.current ?? null;
    }

    function clearReleaseTimer(): void {
      if (releaseTimer !== null) {
        clearTimeout(releaseTimer);
        releaseTimer = null;
      }
    }

    function setTransform(x: number, withTransition: boolean): void {
      const el = getEl();
      if (!el) return;
      el.style.transition = withTransition ? RELEASE_TRANSITION : "";
      el.style.transform = x === 0 ? "" : `translate3d(${x}px, 0, 0)`;
      el.style.willChange = withTransition || x !== 0 ? "transform" : "";
    }

    function clearStyles(): void {
      const el = getEl();
      if (!el) return;
      el.style.transition = "";
      el.style.transform = "";
      el.style.willChange = "";
    }

    function reset(): void {
      armed = false;
      triggered = false;
      dragging = false;
    }

    function onTouchStart(e: TouchEvent): void {
      if (e.touches.length !== 1 || isAnyModalOpen()) {
        reset();
        return;
      }
      clearReleaseTimer();
      const t = e.touches[0];
      startX = t.clientX;
      startY = t.clientY;
      lastX = startX;
      lastTime = e.timeStamp;
      velocityX = 0;
      armed = startX <= EDGE_THRESHOLD;
      triggered = false;
      dragging = false;
    }

    function onTouchMove(e: TouchEvent): void {
      if (!armed || triggered || e.touches.length !== 1) return;
      const t = e.touches[0];
      const currentTime = e.timeStamp;
      const dt = currentTime - lastTime;

      // 速度の計算 (px/ms)
      if (dt > 0) {
        velocityX = (t.clientX - lastX) / dt;
        lastX = t.clientX;
        lastTime = currentTime;
      }

      const dx = t.clientX - startX;
      const dy = t.clientY - startY;
      if (
        !dragging &&
        Math.abs(dy) > VERTICAL_BAILOUT &&
        Math.abs(dy) > Math.abs(dx) * VERTICAL_TOLERANCE
      ) {
        armed = false;
        return;
      }
      if (dx > 0) {
        dragging = true;
        e.preventDefault();
        // ネイティブのように指に追従させるためMath.minの制限を外す
        setTransform(dx, false);
      }
    }

    function onTouchEnd(e: TouchEvent): void {
      if (!armed) {
        reset();
        return;
      }
      // 指を止めてから離した場合は速度による発動を防ぐ
      if (e.timeStamp - lastTime > 50) {
        velocityX = 0;
      }
      const dx = dragging
        ? (e.changedTouches[0]?.clientX ?? startX) - startX
        : 0;
      // 速度が閾値を超える、または画面の半分以上スワイプされたか
      const shouldTrigger =
        velocityX > VELOCITY_THRESHOLD || dx > window.innerWidth / 2;

      if (shouldTrigger && !triggered) {
        triggered = true;
        const el = getEl();
        if (el) {
          el.style.transition = RELEASE_TRANSITION;
          el.style.transform = `translate3d(${window.innerWidth}px, 0, 0)`;
          el.style.willChange = "transform";
        }
        releaseTimer = setTimeout(() => {
          releaseTimer = null;
          callbackRef.current();
          clearStyles();
        }, RELEASE_DURATION_MS);
      } else if (dragging) {
        setTransform(0, true);
        releaseTimer = setTimeout(() => {
          releaseTimer = null;
          clearStyles();
        }, RELEASE_DURATION_MS + 20);
      }

      armed = false;
      dragging = false;
    }

    document.addEventListener("touchstart", onTouchStart, { passive: true });
    document.addEventListener("touchmove", onTouchMove, { passive: false });
    document.addEventListener("touchend", onTouchEnd, { passive: true });
    document.addEventListener("touchcancel", onTouchEnd, { passive: true });

    return (): void => {
      document.removeEventListener("touchstart", onTouchStart);
      document.removeEventListener("touchmove", onTouchMove);
      document.removeEventListener("touchend", onTouchEnd);
      document.removeEventListener("touchcancel", onTouchEnd);
      clearReleaseTimer();
      clearStyles();
    };
  }, []);
}
