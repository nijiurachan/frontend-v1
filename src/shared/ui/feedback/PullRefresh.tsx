import { type ReactNode, useEffect, useRef, useState } from "react";
import { FiArrowDown, FiArrowUp } from "react-icons/fi";
import { Loading } from "@/shared/ui/feedback/Loading";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/**
 * Kept for API compatibility with callers that used these as scroll offsets
 * during the scroll-based PTR era. This implementation drives animation with
 * CSS transform instead of real scrolling, so no spacer is needed.
 */
export const PULL_ZONE_HEIGHT = 0;
export const BOTTOM_SPACER_HEIGHT = 0;

/** Pull distance required to trigger refresh (px, in damped-offset units). */
const DEFAULT_PULL_THRESHOLD = 120;

/** Cooldown after refresh (ms). */
const DEFAULT_COOLDOWN_MS = 800;

/** Minimum display time for refresh indicator (ms). */
const MIN_REFRESH_DISPLAY_MS = 800;

/** Finger-to-offset damping ratio (0–1). 0.5 = finger moves 2× the offset. */
const DRAG_RESISTANCE = 0.5;

/** Hard visual cap on the damped offset (px). */
const MAX_OFFSET = 260;

// ---------------------------------------------------------------------------
// Spring physics (dt-based, tuned for 60 fps baseline)
// ---------------------------------------------------------------------------

const SPRING_K = 0.25;
const SPRING_C = 0.15;
const AIR_RESISTANCE = 0.42;
const MAX_VELOCITY = 40;

/** Target frame duration for physics integration (60 fps baseline). */
const TARGET_FRAME_MS: number = 1000 / 60;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type State = "idle" | "pulling" | "refreshing" | "cooldown" | "animating";

export type IndicatorState = {
  progress: number;
  refreshing: boolean;
  opacity: number;
};

export type PullRefreshProps = {
  children: ReactNode;
  onRefresh?: () => void | Promise<void>;
  pullThreshold?: number;
  cooldownMs?: number;
  renderTopIndicator?: (state: IndicatorState) => ReactNode;
  renderBottomIndicator?: (state: IndicatorState) => ReactNode;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function calcProgress(offset: number, threshold: number): number {
  return Math.min(Math.max(0, (Math.abs(offset) / threshold) * 100), 100);
}

function calcOpacity(progress: number, refreshing: boolean): number {
  if (refreshing) return 1;
  return Math.max(0, progress - 10) / 100;
}

function rubberBand(raw: number): number {
  const sign = Math.sign(raw);
  const abs = Math.abs(raw) * DRAG_RESISTANCE;
  return sign * Math.min(abs, MAX_OFFSET);
}

function isAtTop(): boolean {
  return window.scrollY <= 0;
}

function isAtBottom(): boolean {
  return (
    window.scrollY + window.innerHeight >=
    document.documentElement.scrollHeight - 1
  );
}

// ---------------------------------------------------------------------------
// Default indicators
// ---------------------------------------------------------------------------

function DefaultTopIndicator({
  progress,
  refreshing,
  opacity,
}: IndicatorState): ReactNode {
  const rotation = Math.min(progress, 100) * 1.8;
  return (
    <div
      className="fixed left-0 right-0 flex justify-center pointer-events-none z-30"
      style={{ top: "calc(env(safe-area-inset-top) + 74px)", opacity }}
    >
      {refreshing ? (
        <Loading size="sm" />
      ) : (
        <FiArrowDown
          className="text-foreground"
          size={20}
          style={{ transform: `rotate(${rotation}deg)` }}
          aria-hidden="true"
        />
      )}
    </div>
  );
}

function DefaultBottomIndicator({
  progress,
  refreshing,
  opacity,
}: IndicatorState): ReactNode {
  const rotation = Math.min(progress, 100) * 1.8;
  return (
    <div
      className="fixed left-0 right-0 flex justify-center pointer-events-none z-30"
      style={{ bottom: "130px", opacity }}
    >
      {refreshing ? (
        <Loading size="sm" />
      ) : (
        <FiArrowUp
          className="text-foreground"
          size={20}
          style={{ transform: `rotate(${-rotation}deg)` }}
          aria-hidden="true"
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function PullRefresh({
  children,
  onRefresh,
  pullThreshold = DEFAULT_PULL_THRESHOLD,
  cooldownMs = DEFAULT_COOLDOWN_MS,
  renderTopIndicator = DefaultTopIndicator,
  renderBottomIndicator = DefaultBottomIndicator,
}: PullRefreshProps): ReactNode {
  const containerRef = useRef<HTMLDivElement>(null);

  const stateRef = useRef<State>("idle");
  const activeZoneRef = useRef<"top" | "bottom" | null>(null);

  // Current visual offset (px). Positive = top pull, negative = bottom pull.
  const offsetRef = useRef(0);

  // Touch baseline. Reset to current Y at the moment PTR engages.
  const baselineYRef = useRef(0);
  const engagedRef = useRef(false);

  // Last touch sample, used to compute finger velocity for spring continuity.
  const lastMoveYRef = useRef(0);
  const lastMoveTimeRef = useRef(0);
  // Damped offset velocity in offset-px per 60 fps frame (matches spring units).
  const fingerVelocityRef = useRef(0);

  const cooldownTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const animFrameRef = useRef(0);

  // rAF-throttled indicator updates
  const indicatorRafRef = useRef(0);
  const pendingTopRef = useRef<IndicatorState | null | undefined>(undefined);
  const pendingBottomRef = useRef<IndicatorState | null | undefined>(undefined);

  const onRefreshRef = useRef(onRefresh);

  const [topIndicator, setTopIndicator] = useState<IndicatorState | null>(null);
  const [bottomIndicator, setBottomIndicator] = useState<IndicatorState | null>(
    null,
  );

  useEffect((): void => {
    onRefreshRef.current = onRefresh;
  }, [onRefresh]);

  useEffect(() => {
    // -- DOM offset writer (bypasses React for the transform) --

    function applyOffset(offset: number): void {
      offsetRef.current = offset;
      const el = containerRef.current;
      if (!el) return;
      el.style.transform = offset === 0 ? "" : `translate3d(0, ${offset}px, 0)`;
    }

    // -- Indicator rAF throttle --

    function flushIndicatorUpdate(): void {
      indicatorRafRef.current = 0;
      const top = pendingTopRef.current;
      const bot = pendingBottomRef.current;
      pendingTopRef.current = undefined;
      pendingBottomRef.current = undefined;
      if (top !== undefined) setTopIndicator(top);
      if (bot !== undefined) setBottomIndicator(bot);
    }

    function scheduleIndicator(
      side: "top" | "bottom",
      state: IndicatorState | null,
    ): void {
      if (side === "top") pendingTopRef.current = state;
      else pendingBottomRef.current = state;
      if (!indicatorRafRef.current) {
        indicatorRafRef.current = requestAnimationFrame(flushIndicatorUpdate);
      }
    }

    function cancelPendingIndicator(): void {
      if (indicatorRafRef.current) {
        cancelAnimationFrame(indicatorRafRef.current);
        indicatorRafRef.current = 0;
      }
      pendingTopRef.current = undefined;
      pendingBottomRef.current = undefined;
    }

    function makeIndicator(
      progress: number,
      refreshing: boolean,
    ): IndicatorState {
      return {
        progress,
        refreshing,
        opacity: calcOpacity(progress, refreshing),
      };
    }

    function clampVelocity(v: number): number {
      return Math.max(-MAX_VELOCITY, Math.min(MAX_VELOCITY, v));
    }

    // -- Spring animation (offset → 0, no bounce) --

    function startSpringAnimation(
      clearIndicators: boolean = true,
      settledState: State = "idle",
      initialVelocity: number = 0,
    ): void {
      cancelAnimationFrame(animFrameRef.current);
      stateRef.current = settledState === "idle" ? "animating" : settledState;
      if (clearIndicators) {
        cancelPendingIndicator();
        setTopIndicator(null);
        setBottomIndicator(null);
      }

      let velocity = clampVelocity(initialVelocity);
      let position = offsetRef.current;
      let lastTime = performance.now();

      function step(now: number): void {
        // Frame-rate independent integration. Physics tuned for 60 fps.
        const rawDt = now - lastTime;
        lastTime = now;
        const dt = Math.min(Math.max(rawDt, 1), 64) / TARGET_FRAME_MS;

        const displacement = Math.abs(position);

        // Converged near 0.
        if (displacement < 0.5 && Math.abs(velocity) < 0.5) {
          applyOffset(0);
          stateRef.current = settledState;
          if (settledState === "idle") activeZoneRef.current = null;
          return;
        }

        // Always pull toward 0. The (displacement + SPRING_C) term mirrors the
        // original "constant gravity" behaviour — keeps motion alive at small
        // displacements so convergence is snappy.
        const direction = -Math.sign(position);
        const accel = direction * SPRING_K * (displacement + SPRING_C);
        velocity = clampVelocity(
          velocity + (accel - AIR_RESISTANCE * velocity) * dt,
        );
        const newPosition = position + velocity * dt;

        // No-bounce: if we'd cross 0, snap.
        const crossed =
          (position > 0 && newPosition <= 0) ||
          (position < 0 && newPosition >= 0);
        if (crossed) {
          applyOffset(0);
          stateRef.current = settledState;
          if (settledState === "idle") activeZoneRef.current = null;
          return;
        }

        position = newPosition;
        applyOffset(position);
        animFrameRef.current = requestAnimationFrame(step);
      }

      animFrameRef.current = requestAnimationFrame(step);
    }

    // -- Cooldown & refresh --

    function enterCooldown(clearIndicators: boolean = true): void {
      stateRef.current = "cooldown";
      if (clearIndicators) {
        cancelPendingIndicator();
        setTopIndicator(null);
        setBottomIndicator(null);
      }
      startSpringAnimation(clearIndicators, "cooldown");
      cooldownTimerRef.current = setTimeout(() => {
        stateRef.current = "idle";
        activeZoneRef.current = null;
      }, cooldownMs);
    }

    function triggerRefresh(zone: "top" | "bottom"): void {
      const callback = onRefreshRef.current;
      if (!callback) return;

      stateRef.current = "refreshing";
      cancelPendingIndicator();
      const setIndicator =
        zone === "top" ? setTopIndicator : setBottomIndicator;
      setIndicator(makeIndicator(100, true));

      let fetchDone = false;
      let displayDone = false;

      const maybeClear = (): void => {
        if (fetchDone && displayDone) setIndicator(null);
      };

      setTimeout(() => {
        displayDone = true;
        maybeClear();
      }, MIN_REFRESH_DISPLAY_MS);

      // Normalize sync throws and reject — both must still flow into cooldown.
      Promise.resolve()
        .then(() => callback())
        .catch(() => undefined)
        .finally(() => {
          fetchDone = true;
          enterCooldown(false);
          maybeClear();
        });
    }

    // -- Touch handlers --

    function resetVelocityTracking(): void {
      lastMoveTimeRef.current = 0;
      lastMoveYRef.current = 0;
      fingerVelocityRef.current = 0;
    }

    function resetPull(): void {
      engagedRef.current = false;
      stateRef.current = "idle";
      activeZoneRef.current = null;
      cancelPendingIndicator();
      setTopIndicator(null);
      setBottomIndicator(null);
      applyOffset(0);
      resetVelocityTracking();
    }

    function onTouchStart(e: TouchEvent): void {
      if (e.touches.length !== 1) return;
      engagedRef.current = false;
      baselineYRef.current = e.touches[0].clientY;
      resetVelocityTracking();
    }

    function onTouchMove(e: TouchEvent): void {
      if (e.touches.length !== 1) return;
      const state = stateRef.current;
      if (
        state === "refreshing" ||
        state === "animating" ||
        state === "cooldown"
      ) {
        return;
      }
      if (!onRefreshRef.current) return;

      const currentY = e.touches[0].clientY;

      // Not yet engaged — look for a pull-into-edge gesture.
      if (!engagedRef.current) {
        const delta = currentY - baselineYRef.current;
        if (delta > 0 && isAtTop()) {
          engagedRef.current = true;
          stateRef.current = "pulling";
          activeZoneRef.current = "top";
          // Reset baseline so the offset starts at 0, not wherever the
          // finger happened to be when scrollTop hit 0. Wait for the next
          // move to actually pull — falling through here would compute
          // delta=0 and immediately re-trigger the disengage check below.
          baselineYRef.current = currentY;
          lastMoveYRef.current = currentY;
          lastMoveTimeRef.current = performance.now();
          // Take ownership now so the browser doesn't fire its native
          // overscroll bounce on this same frame.
          e.preventDefault();
          return;
        } else if (delta < 0 && isAtBottom()) {
          engagedRef.current = true;
          stateRef.current = "pulling";
          activeZoneRef.current = "bottom";
          baselineYRef.current = currentY;
          lastMoveYRef.current = currentY;
          lastMoveTimeRef.current = performance.now();
          e.preventDefault();
          return;
        } else {
          // Track the latest Y so the "engagement delta" is measured
          // from the moment the user reaches the edge.
          baselineYRef.current = currentY;
          return;
        }
      }

      const zone = activeZoneRef.current;
      if (!zone) return;

      const delta = currentY - baselineYRef.current;

      // Released back past the starting point — hand control back to native scroll.
      if ((zone === "top" && delta <= 0) || (zone === "bottom" && delta >= 0)) {
        resetPull();
        return;
      }

      // Own the gesture.
      e.preventDefault();
      const damped = rubberBand(delta);
      applyOffset(damped);
      scheduleIndicator(
        zone,
        makeIndicator(calcProgress(damped, pullThreshold), false),
      );

      // Track damped finger velocity in offset-px per 60 fps frame so the
      // spring can pick up where the finger left off (no perceived pause
      // between drag and spring-back on partial pulls). When the gap since
      // the last sample is too large to be meaningful (paused finger,
      // dropped frames), zero the velocity rather than leaving a stale
      // sample that onTouchEnd could reuse as a phantom fling.
      const now = performance.now();
      const moveDt = now - lastMoveTimeRef.current;
      if (lastMoveTimeRef.current > 0 && moveDt > 0 && moveDt < 64) {
        const fingerDy = currentY - lastMoveYRef.current;
        fingerVelocityRef.current =
          (fingerDy * DRAG_RESISTANCE * TARGET_FRAME_MS) / moveDt;
      } else {
        fingerVelocityRef.current = 0;
      }
      lastMoveYRef.current = currentY;
      lastMoveTimeRef.current = now;
    }

    function onTouchEnd(): void {
      const state = stateRef.current;
      const zone = activeZoneRef.current;
      engagedRef.current = false;

      if (state !== "pulling" || !zone) {
        resetVelocityTracking();
        return;
      }

      const offsetAbs = Math.abs(offsetRef.current);
      if (offsetAbs >= pullThreshold) {
        // Keep the content offset in place while refreshing; enterCooldown
        // will spring it back to 0 when the callback settles.
        triggerRefresh(zone);
      } else {
        // Stale velocity (long pause before release) shouldn't fling.
        const now = performance.now();
        const sinceLastMove = now - lastMoveTimeRef.current;
        const initialVel =
          lastMoveTimeRef.current > 0 && sinceLastMove < 64
            ? fingerVelocityRef.current
            : 0;
        startSpringAnimation(true, "idle", initialVel);
      }
      resetVelocityTracking();
    }

    function onTouchCancel(): void {
      engagedRef.current = false;
      if (stateRef.current === "pulling") {
        startSpringAnimation();
      }
      resetVelocityTracking();
    }

    // touchmove must be non-passive so we can preventDefault when actively
    // pulling. Scope to the container element so the rest of the page stays
    // fully passive — preventDefault only affects touches starting inside.
    const target = containerRef.current;
    if (!target) return;
    target.addEventListener("touchstart", onTouchStart, { passive: true });
    target.addEventListener("touchmove", onTouchMove, { passive: false });
    target.addEventListener("touchend", onTouchEnd, { passive: true });
    target.addEventListener("touchcancel", onTouchCancel, { passive: true });

    return (): void => {
      target.removeEventListener("touchstart", onTouchStart);
      target.removeEventListener("touchmove", onTouchMove);
      target.removeEventListener("touchend", onTouchEnd);
      target.removeEventListener("touchcancel", onTouchCancel);
      cancelAnimationFrame(animFrameRef.current);
      if (indicatorRafRef.current) {
        cancelAnimationFrame(indicatorRafRef.current);
        indicatorRafRef.current = 0;
      }
      if (cooldownTimerRef.current) clearTimeout(cooldownTimerRef.current);
    };
  }, [pullThreshold, cooldownMs]);

  return (
    <>
      <div ref={containerRef} style={{ willChange: "transform" }}>
        {children}
      </div>
      {topIndicator && renderTopIndicator(topIndicator)}
      {bottomIndicator && renderBottomIndicator(bottomIndicator)}
    </>
  );
}
