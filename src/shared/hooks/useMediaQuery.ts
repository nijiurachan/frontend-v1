import { useEffect, useLayoutEffect, useState } from "react";
import {
  createForcePcCookie,
  type ForcePcCookieAction,
  type ForcePcPreference,
  resolveDesktopDisplayMode,
  resolveForcePcPreference,
} from "@/shared/lib/forcePc";

let cachedForcePcPreference: ForcePcPreference | undefined;
let appliedCookieAction: ForcePcCookieAction = "none";

/**
 * ブラウザのメディアクエリを購読する。
 * 初期値はブラウザで同期的に取得するため、デスクトップで一瞬だけ
 * モバイルレイアウトが表示されるレイアウトシフトを避けられる。
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia(query);
    const handleChange = (event: MediaQueryListEvent): void => {
      setMatches(event.matches);
    };

    mediaQuery.addEventListener("change", handleChange);
    return (): void => mediaQuery.removeEventListener("change", handleChange);
  }, [query]);

  return matches;
}

export function useIsDesktop(): boolean {
  const viewportIsDesktop = useMediaQuery("(min-width: 1024px)");
  const forcePc = useIsPcForced();
  return resolveDesktopDisplayMode(viewportIsDesktop, forcePc) !== "mobile";
}

/** 現在の表示が幅ではなく利用者指定でPC版に固定されているかを返す。 */
export function useIsPcForced(): boolean {
  const preference = getInitialForcePcPreference();

  useLayoutEffect(() => {
    if (
      preference.cookieAction === "none" ||
      preference.cookieAction === appliedCookieAction
    ) {
      return;
    }

    // biome-ignore lint/suspicious/noDocumentCookie: 初回描画直後に互換cookieを同期反映し、即時reloadでも設定を失わないため
    document.cookie = createForcePcCookie(preference.cookieAction);
    appliedCookieAction = preference.cookieAction;
  }, [preference]);

  return preference.isForced;
}

function getInitialForcePcPreference(): ForcePcPreference {
  if (cachedForcePcPreference) return cachedForcePcPreference;
  if (typeof window === "undefined") {
    return { isForced: false, cookieAction: "none" };
  }

  cachedForcePcPreference = resolveForcePcPreference(
    window.location.search,
    document.cookie,
  );
  return cachedForcePcPreference;
}
