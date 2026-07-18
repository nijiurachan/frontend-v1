export interface WheelReloadState {
  direction: "up" | "down" | null;
  count: number;
  lastAt: number;
  cooldownUntil: number;
}
export const initialWheelReloadState = (): WheelReloadState => ({
  direction: null,
  count: 0,
  lastAt: 0,
  cooldownUntil: 0,
});
export function recordEdgeWheel(
  state: WheelReloadState,
  deltaY: number,
  atEdge: boolean,
  now: number = Date.now(),
): { state: WheelReloadState; reload: boolean } {
  if (!atEdge || deltaY === 0 || now < state.cooldownUntil)
    return { state: { ...state, direction: null, count: 0 }, reload: false };
  const direction = deltaY > 0 ? "down" : "up";
  const count =
    state.direction === direction && now - state.lastAt <= 500
      ? state.count + 1
      : 1;
  if (count >= 3)
    return {
      state: {
        direction: null,
        count: 0,
        lastAt: now,
        cooldownUntil: now + 1000,
      },
      reload: true,
    };
  return { state: { ...state, direction, count, lastAt: now }, reload: false };
}
