import {
  createElement,
  type FunctionComponent,
  useEffect,
  useState,
} from "react";
import { listAnnounceIcons } from "@/features/settings/lib/announceIconDb";

/**
 * nijiurachan-jsの`<announce-banner>`カスタム要素を包むReactラッパー。
 * `icon-src`は`connectedCallback`でのみ読まれるため、
 * このコンポーネントのmount時に IndexedDB から候補を1件抽選して渡す。
 * BlobをそのままobjectURL化するのでネットワーク往復なし=常に即描画。
 */
export const AnnounceBanner: FunctionComponent = () => {
  const [iconSrc, setIconSrc] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let localUrl: string | null = null;
    void (async (): Promise<void> => {
      try {
        const icons = await listAnnounceIcons();
        if (cancelled) return;
        if (icons.length > 0) {
          const pick = icons[Math.floor(Math.random() * icons.length)];
          if (pick) {
            localUrl = URL.createObjectURL(pick.blob);
            setIconSrc(localUrl);
          }
        }
      } catch (e) {
        console.warn("AnnounceBanner: アイコン読込に失敗", e);
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return (): void => {
      cancelled = true;
      if (localUrl) URL.revokeObjectURL(localUrl);
    };
  }, []);

  // 抽選前は描画しない(icon-srcはconnectedCallbackで一度だけ読まれるため、
  // 空描画→再描画にすると既定アイコンでmountしてしまう)
  if (!ready) return null;

  const attrs: Record<string, string> = { theme: "auto", class: "px-2" };
  if (iconSrc) {
    attrs["icon-src"] = iconSrc;
  }
  return createElement("announce-banner", attrs);
};
