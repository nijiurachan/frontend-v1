import { createElement, type FunctionComponent, useState } from "react";
import { useSettingsStore } from "@/features/settings/hooks";

/**
 * nijiurachan-jsの`<announce-banner>`カスタム要素を包むReactラッパー。
 * `icon-src`は`connectedCallback`でのみ読まれるため、
 * 表示のたび(=このコンポーネントのmount毎)にストアの候補から1件抽選して渡す。
 */
export const AnnounceBanner: FunctionComponent = () => {
  const iconSrcs = useSettingsStore((s) => s.announceBannerIconSrcs);
  // mount時に一度だけ抽選し、以後は同じ値を使う(次回mountで再抽選)
  const [iconSrc] = useState(() => pickRandom(iconSrcs));
  const attrs: Record<string, string> = { theme: "auto", class: "px-2" };
  if (iconSrc) {
    attrs["icon-src"] = iconSrc;
  }
  return createElement("announce-banner", attrs);
};

function pickRandom(urls: readonly string[]): string {
  if (urls.length === 0) return "";
  return urls[Math.floor(Math.random() * urls.length)] ?? "";
}
