/**
 * はっちゃん (お絵かきブックマークレット) iOS描画バグ修正パッチ。
 *
 * はっちゃんは iOS Safari のタッチイベントを独自に PointerEvent へ変換するが、
 * その際 `offsetX` / `offsetY` を設定しない (NaN / 0)。canvas 内座標が
 * 計算できず描画位置が狂う原因になる。
 *
 * 偽装イベントには `isEmulated` フラグが立つので、それを検知して
 * `clientX - target.getBoundingClientRect().left` 等で `offsetX/Y` を補完する。
 * MouseEvent.prototype を上書きすれば PointerEvent (継承クラス) にも効く。
 *
 * `installCanvas98Patch` の前後に依存しないグローバル one-shot パッチなので、
 * アプリ起動時に1回だけ呼べばよい。
 */

interface EmulatedEvent {
  isEmulated?: boolean;
  clientX?: number;
  clientY?: number;
  target: EventTarget | null;
}

export function installIosOffsetPatch(): void {
  for (const prop of ["offsetX", "offsetY"] as const) {
    const original = Object.getOwnPropertyDescriptor(
      MouseEvent.prototype,
      prop,
    );
    if (!original?.get) continue;

    Object.defineProperty(MouseEvent.prototype, prop, {
      get(this: MouseEvent & EmulatedEvent): number | undefined {
        if (
          this.isEmulated &&
          this.clientX !== undefined &&
          this.clientY !== undefined &&
          this.target instanceof Element
        ) {
          const rect = this.target.getBoundingClientRect();
          return prop === "offsetX"
            ? this.clientX - rect.left
            : this.clientY - rect.top;
        }
        return original.get?.call(this);
      },
      configurable: true,
    });
  }
}
