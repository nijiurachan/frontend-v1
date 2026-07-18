import { describe, expect, test } from "bun:test";
import { getFocusTrapTarget } from "@/shared/ui/overlay/dialogFocus";

const focusable = (): HTMLElement =>
  ({ focus: () => undefined }) as unknown as HTMLElement;

describe("getFocusTrapTarget", () => {
  test("末尾でTabを押すと先頭へ戻す", () => {
    const first = focusable();
    const last = focusable();

    expect(getFocusTrapTarget([first, last], last, false)).toBe(first);
  });

  test("先頭でShift+Tabを押すと末尾へ戻す", () => {
    const first = focusable();
    const last = focusable();

    expect(getFocusTrapTarget([first, last], first, true)).toBe(last);
  });

  test("範囲外にfocusがある場合もdialog内へ戻す", () => {
    const first = focusable();
    const last = focusable();
    const outside = focusable();

    expect(getFocusTrapTarget([first, last], outside, false)).toBe(first);
    expect(getFocusTrapTarget([first, last], outside, true)).toBe(last);
  });
});
