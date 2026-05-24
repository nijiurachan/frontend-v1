import { useNavigate, useParams, useSearch } from "@tanstack/react-router";
import { useEffect, useMemo } from "react";
import { FiX } from "react-icons/fi";
import { useNgStore } from "@/features/ng-filter/stores";
import { ImageGalleryView } from "@/features/thread/components/ImageGalleryView";
import { useThread } from "@/features/thread/hooks/useThread";
import { extractImages } from "@/features/thread/utils/extractImages";
import { LoadingScreen, Message } from "@/shared/ui/feedback";

export const GalleryPage: React.FunctionComponent = () => {
  const { threadId } = useParams({ from: "/gallery/$threadId" });
  const { start } = useSearch({ from: "/gallery/$threadId" });
  const navigate = useNavigate();
  const id = Number(threadId);

  // ギャラリー表示中はhtml/bodyを完全ロックしてiOS Safariのビューポート弾性スクロールを防止
  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;

    const prevHtmlOverflow = html.style.overflow;
    const prevHtmlPosition = html.style.position;
    const prevHtmlWidth = html.style.width;
    const prevHtmlHeight = html.style.height;
    const prevBodyOverflow = body.style.overflow;
    const prevBodyPosition = body.style.position;
    const prevBodyWidth = body.style.width;
    const prevBodyHeight = body.style.height;

    html.style.overflow = "hidden";
    html.style.position = "fixed";
    html.style.width = "100%";
    html.style.height = "100%";
    body.style.overflow = "hidden";
    body.style.position = "fixed";
    body.style.width = "100%";
    body.style.height = "100%";

    return (): void => {
      html.style.overflow = prevHtmlOverflow;
      html.style.position = prevHtmlPosition;
      html.style.width = prevHtmlWidth;
      html.style.height = prevHtmlHeight;
      body.style.overflow = prevBodyOverflow;
      body.style.position = prevBodyPosition;
      body.style.width = prevBodyWidth;
      body.style.height = prevBodyHeight;
    };
  }, []);

  const { data, isLoading, error } = useThread(id);
  const { isPostHidden, showNgContent } = useNgStore();

  const images = useMemo(() => {
    if (!data) return [];
    const posts = showNgContent
      ? data.posts
      : data.posts.filter((post) => !isPostHidden(post));
    return extractImages(posts);
  }, [data, isPostHidden, showNgContent]);

  if (isLoading) return <LoadingScreen />;
  if (error || !data) {
    return <Message variant="error">スレッドの読み込みに失敗しました</Message>;
  }
  if (images.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 p-4">
        <Message variant="info">画像がありません</Message>
      </div>
    );
  }

  const initialIndex = Math.min(start ?? 0, images.length - 1);

  return (
    <div
      className="fixed inset-0 z-50 bg-background flex flex-col"
      style={{ overscrollBehavior: "none" }}
    >
      <title>{`画像ギャラリー No.${threadId} - ${import.meta.env.APP_NAME}`}</title>
      <header className="flex items-center justify-end px-4 py-3 bg-card border-b border-border">
        <button
          type="button"
          onClick={(): void => {
            window.close();
            navigate({
              to: "/thread/$threadId",
              params: { threadId },
            }).catch(console.warn);
          }}
          className="p-1 rounded-full hover:bg-muted transition-colors"
          aria-label="閉じる"
        >
          <FiX className="w-5 h-5 text-foreground" />
        </button>
      </header>
      <ImageGalleryView images={images} initialIndex={initialIndex} />
    </div>
  );
};
