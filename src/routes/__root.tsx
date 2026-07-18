import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createRootRoute, HeadContent, Outlet } from "@tanstack/react-router";
import { lazy, Suspense, useLayoutEffect, useState } from "react";
import { DesktopLayout } from "@/app/layouts/DesktopLayout";
import { MobileLayout } from "@/app/layouts/MobileLayout";
import { usePlayerStore } from "@/features/player/stores/playerStore";
import { useSettingsStore } from "@/features/settings/hooks";
import { FONT_SIZE_DEFAULT } from "@/features/settings/stores/settingsStore";
import { useIsDesktop } from "@/shared/hooks";
import { cn } from "@/shared/lib/cn";
import { ModalProvider } from "@/shared/ui/overlay";
import { ToastProvider } from "@/shared/ui/toast";

// MiniPlayer は再生開始時に初めてロード（motion/react や Player 周辺コードを初期 bundle に含めない）
const LazyMiniPlayer: React.LazyExoticComponent<React.ComponentType> = lazy(
  () =>
    import("@/features/player/ui/MiniPlayer").then((m) => ({
      default: m.MiniPlayer,
    })),
);

const RootComponent: React.FunctionComponent = () => {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            retry: 1,
          },
        },
      }),
  );

  useRenderSettings();

  const privacyMode = useSettingsStore((s) => s.privacyMode);
  // MiniPlayer が一度でも開かれたかをトラッキング: 開いた後に閉じても chunk は既に DL 済み
  const miniPlayerVisible = usePlayerStore((s) => s.miniPlayer.visible);
  const isDesktop = useIsDesktop();

  return (
    <QueryClientProvider client={queryClient}>
      <HeadContent />
      <title>{import.meta.env.APP_NAME}</title>
      <div
        id="app-root"
        className={cn(
          "min-h-screen bg-background text-foreground",
          privacyMode && "privacy-vignette",
        )}
      >
        <ModalProvider>
          {isDesktop ? (
            <DesktopLayout>
              <Outlet />
            </DesktopLayout>
          ) : (
            <MobileLayout>
              <Outlet />
            </MobileLayout>
          )}
          {miniPlayerVisible && (
            <Suspense fallback={null}>
              <LazyMiniPlayer />
            </Suspense>
          )}
        </ModalProvider>
        <ToastProvider />
      </div>
    </QueryClientProvider>
  );
};

// biome-ignore lint/nursery/useExplicitType: 型が長く書き出してもメリットが薄い
export const Route = createRootRoute({
  component: RootComponent,
});

/** 表示設定を反映する */
function useRenderSettings(): void {
  const darkMode = useSettingsStore((s) => s.darkMode);
  const fontSize = useSettingsStore((s) => s.fontSize);
  const isDesktop = useIsDesktop();

  useLayoutEffect(() => {
    // PC版は旧AI_BBS再現のライト配色で固定する。共通コンポーネント
    // (モーダル・フォーム等) もライト変数で描画しないと文字が溶ける。
    document.documentElement.classList.toggle(
      "light-mode",
      isDesktop || darkMode === false,
    );
  }, [darkMode, isDesktop]);

  useLayoutEffect(() => {
    document.documentElement.style.setProperty(
      "font-size",
      `${fontSize / FONT_SIZE_DEFAULT}rem`,
    );
  }, [fontSize]);
}
