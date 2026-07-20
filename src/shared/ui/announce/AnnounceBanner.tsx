import { createElement, type FunctionComponent } from "react";
import { useSettingsStore } from "@/features/settings/hooks";

/**
 * nijiurachan-jsの`<announce-banner>`カスタム要素を包むReactラッパー。
 * `icon-src`は`connectedCallback`でのみ読まれるため、
 * 設定変更時は`key`で強制remountして反映する。
 */
export const AnnounceBanner: FunctionComponent = () => {
  const iconSrc = useSettingsStore((s) => s.announceBannerIconSrc);
  const attrs: Record<string, string> = { theme: "auto" };
  if (iconSrc) {
    attrs["icon-src"] = iconSrc;
  }
  return createElement("announce-banner", { key: iconSrc, ...attrs });
};
