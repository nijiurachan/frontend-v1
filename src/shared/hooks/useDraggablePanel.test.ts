import { describe, expect, test } from "bun:test";
import { clampPanelPosition } from "./useDraggablePanel";

describe("clampPanelPosition", () => {
  test("keeps an in-viewport position unchanged", () => {
    expect(clampPanelPosition(100, 200, 325, 1920, 1080)).toEqual({
      left: 100,
      top: 200,
    });
  });

  test("keeps a grabbable sliver when dragged off the left edge", () => {
    expect(clampPanelPosition(-1000, 200, 325, 1920, 1080)).toEqual({
      left: 40 - 325,
      top: 200,
    });
  });

  test("keeps a grabbable sliver when dragged off the right edge", () => {
    expect(clampPanelPosition(5000, 200, 325, 1920, 1080)).toEqual({
      left: 1920 - 40,
      top: 200,
    });
  });

  test("never lets the title bar leave the top or bottom", () => {
    expect(clampPanelPosition(100, -50, 325, 1920, 1080).top).toBe(0);
    expect(clampPanelPosition(100, 5000, 325, 1920, 1080).top).toBe(1080 - 40);
  });
});
