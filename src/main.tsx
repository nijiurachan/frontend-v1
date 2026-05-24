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
import { OnlineUsersIndicatorElement } from "@nijiurachan/js/elements/online-users-indicator";
import { makeUpfileInputV2Element } from "@nijiurachan/js/elements/upfile-input-v2";
import { AxnosPaintPopup } from "@nijiurachan/js/io/axnos-paint-popup";
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

OnlineUsersIndicatorElement.define();

initUpfileInput();

createRoot(document.getElementById("root") as HTMLElement).render(makeRoot());

/** ルート要素を作成 */
function makeRoot(): React.ReactElement {
  const router = createRouter({
    routeTree,
    scrollRestoration: true,
    basepath: import.meta.env.BASE_PATH,
    getScrollRestorationKey: ({ pathname, state }: ParsedLocation) =>
      shouldRestoreScrollAt(pathname) ? pathname : (state.__TSR_key as string),
  });

  const settingsStore = createSettingsStore();

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
function initUpfileInput(): void {
  // ポップアップ用のJSパスはimportmapから取得する(Viteの設定参照)
  const paintPopupUrl = import.meta.resolve("#oekaki");

  makeUpfileInputV2Element(
    makeUpfileInputFragmentV2(new AxnosPaintPopup(paintPopupUrl)),
  ).define();

  // はっちゃんのスマホ向け上書き
  installIosOffsetPatch();
  installCanvas98Patch();
}
