const OPEN_ANIMATION_MS = 400;

let originalConfirm: typeof window.confirm | null = null;
let originalViewportContent: string | null = null;

export function restoreConfirm(): void {
  if (originalConfirm) {
    window.confirm = originalConfirm;
    originalConfirm = null;
  }
}

/**
 * はっちゃん(canvas98)拡張が `#canvas98Element` を注入/撤去したときに、
 * スマホのビューポートに合わせたスケール・サイズを強制する。
 *
 * スマホ固有のビューポート/CSS 設定とはっちゃんが想定するサイズが
 * 合わず、UI や描画領域が変なサイズで描画される問題への対処。
 */
export function installCanvas98Patch(): void {
  new MutationObserver((mutations): void => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (node instanceof HTMLElement && node.id === "canvas98Element") {
          onCanvas98Open(node);
          return;
        }
      }
      for (const node of mutation.removedNodes) {
        if (node instanceof HTMLElement && node.id === "canvas98Element") {
          onCanvas98Close();
          return;
        }
      }
    }
  }).observe(document.body, { childList: true });
}

function onCanvas98Open(root: HTMLElement): void {
  lockViewportForCanvas98();

  originalConfirm = window.confirm;
  window.confirm = (): boolean => true;
  setTimeout((): void => InitPositionCanvas98(root), OPEN_ANIMATION_MS);
}

function onCanvas98Close(): void {
  restoreConfirm();
  unlockViewport();
  forceViewportRefresh();
}

/**
 * canvas98 起動中の viewport meta をはっちゃんに適合した値に設定する。描き終わったら復元する。
 */
function lockViewportForCanvas98(): void {
  const meta = document.querySelector<HTMLMetaElement>('meta[name="viewport"]');
  if (!meta) return;
  originalViewportContent = meta.content;
  const scale = computeScale();
  meta.content = `width=device-width, initial-scale=${scale}`;
}

function unlockViewport(): void {
  const meta = document.querySelector<HTMLMetaElement>('meta[name="viewport"]');
  if (!meta || originalViewportContent === null) return;
  meta.content = originalViewportContent;
  originalViewportContent = null;
}

function forceViewportRefresh(): void {
  const meta = document.querySelector<HTMLMetaElement>('meta[name="viewport"]');
  if (meta) {
    const original = meta.content;
    meta.content = "width=device-width, initial-scale=1";
    requestAnimationFrame(() => {
      meta.content = original;
      // スクロールを 1px 動かして戻す → visualViewport の再計算を誘発
      window.scrollBy(0, 1);
      window.scrollBy(0, -1);
    });
  }
}

/**
 * ビューポートサイズを見て縮小スケールを決める。
 * 横は 600px / 縦は 700px を「はっちゃん UI が想定するモバイル相当の論理サイズ」
 * とし、それ未満のときに不足分だけ scale を下げて全体を収める。
 *  - w >= 600 なら A=1.0、未満なら A=w/600
 *  - h >= 700 なら B=1.0、未満なら B=h/700
 *  - 結合は Math.min(A, B)
 */
function computeScale(): number {
  const { w, h } = viewportSize();
  const a = w >= 600 ? 1.0 : w / 600;
  const b = h >= 700 ? 1.0 : h / 700;
  return Math.min(a, b);
}

function viewportSize(): { w: number; h: number } {
  return {
    w: window.visualViewport?.width ?? window.innerWidth,
    h: window.visualViewport?.height ?? window.innerHeight,
  };
}

/**
 * はっちゃん起動時に見きれないように初期カメラ座標設定処理。
 * 初期キャンバスサイズは400pxのため、原点から200pxずらした座標を初期値とする。
 */
function InitPositionCanvas98(root: HTMLElement): void {
  const canvas = root.querySelector("canvas");
  if (!canvas) return;

  let wrapper = canvas.parentElement;
  while (wrapper && wrapper !== root) {
    if (getComputedStyle(wrapper).position === "fixed") break;
    wrapper = wrapper.parentElement;
  }
  if (!wrapper || wrapper === root) return;
  wrapper.style.left = `${200}px`;
  wrapper.style.top = `${200}px`;
}
