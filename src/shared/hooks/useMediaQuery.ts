import { useEffect, useState } from "react";

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
  return useMediaQuery("(min-width: 1024px)");
}
