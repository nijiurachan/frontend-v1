import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createRootRoute, HeadContent, Outlet } from "@tanstack/react-router";
import { lazy, Suspense, useLayoutEffect, useState } from "react";
import { MobileLayout } from "@/app/layouts/MobileLayout";
import { usePlayerStore } from "@/features/player/stores/playerStore";
import { useSettingsStore } from "@/features/settings/hooks";
import { TurnstileProvider } from "@/features/turnstile/components/TurnstileProvider";
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
          <MobileLayout>
            <Outlet />
          </MobileLayout>
          {miniPlayerVisible && (
            <Suspense fallback={null}>
              <LazyMiniPlayer />
            </Suspense>
          )}
        </ModalProvider>
        <ToastProvider />
        <TurnstileProvider />
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

  useLayoutEffect(() => {
    document.documentElement.classList.toggle("light-mode", darkMode === false);
  }, [darkMode]);

  useLayoutEffect(() => {
    document.documentElement.style.setProperty(
      "font-size",
      `${fontSize / 16}rem`,
    );
  }, [fontSize]);
}
