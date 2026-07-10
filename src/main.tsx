import {
  createRouter,
  type ParsedLocation,
  type Router,
  RouterProvider,
} from "@tanstack/react-router";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { routeTree } from "@/routeTree.gen";
import "@/index.css";
import { makeUpfileInputFragmentV2 } from "@nijiurachan/js/components/upfile-input-fragment-v2";
import { makeUpfileInputV2Element } from "@nijiurachan/js/elements/upfile-input-v2";
import { AxnosPaintPopup } from "@nijiurachan/js/io/axnos-paint-popup";
import { KlecksPopup } from "@nijiurachan/js/io/klecks-popup";
import { initCookieStore } from "@nijiurachan/js/util/cookie-store";
import { installCanvas98Patch } from "@/features/otegaki-upfile/lib/canvas98Patch";
import { installIosOffsetPatch } from "@/features/otegaki-upfile/lib/iosOffsetPatch";
import { SettingsStoreContext } from "@/features/settings/hooks";
import { createSettingsStore } from "@/features/settings/stores";

// これがないとViteでUpfileInputがうまく動かない
import "preact";

// Register the router instance for type safety
declare module "@tanstack/react-router" {
  interface Register {
    router: Router<typeof routeTree>;
  }
}

if (!window.cookieStore) {
  await initCookieStore();
}

const settingsStore: ReturnType<typeof createSettingsStore> =
  createSettingsStore();

initUpfileInput(settingsStore);

createRoot(document.getElementById("root") as HTMLElement).render(
  makeRoot(settingsStore),
);

/** ルート要素を作成 */
function makeRoot(
  settingsStore: ReturnType<typeof createSettingsStore>,
): React.ReactElement {
  const router = createRouter({
    routeTree,
    scrollRestoration: true,
    basepath: import.meta.env.BASE_PATH,
    getScrollRestorationKey: ({ pathname, state }: ParsedLocation) =>
      shouldRestoreScrollAt(pathname) ? pathname : (state.__TSR_key as string),
  });

  return (
    <StrictMode>
      <SettingsStoreContext value={settingsStore}>
        <RouterProvider router={router} />
      </SettingsStoreContext>
    </StrictMode>
  );
}

/** スクロールを記憶してほしいページかどうか判定 */
function shouldRestoreScrollAt(pathname: string): boolean {
  return pathname === "/" || pathname.startsWith("/thread/");
}

/** 添付ファイル欄を初期化 */
function initUpfileInput(
  settingsStore: ReturnType<typeof createSettingsStore>,
): void {
  // ポップアップ用のJSパスはimportmapから取得する(Viteの設定参照)
  const paintPopupUrl = import.meta.resolve("#oekaki");
  const klecksPopupUrl = import.meta.resolve("#klecks");
  const klecksEmbedUrl =
    import.meta.env.VITE_KLECKS_EMBED_URL?.trim() ||
    import.meta.resolve("#klecks-embed");

  makeUpfileInputV2Element(
    makeUpfileInputFragmentV2({
      axnos: new AxnosPaintPopup(paintPopupUrl),
      klecks: new KlecksPopup(klecksPopupUrl, klecksEmbedUrl),
      getOekakiTool: () => settingsStore.getState().oekakiTool,
    }),
  ).define();

  // はっちゃんのスマホ向け上書き
  installIosOffsetPatch();
  installCanvas98Patch();
}
