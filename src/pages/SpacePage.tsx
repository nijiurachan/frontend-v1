import { useNavigate, useParams } from "@tanstack/react-router";
import { useEffect, useMemo } from "react";
import { FiX } from "react-icons/fi";
import { useNgStore } from "@/features/ng-filter/stores";
import { SpaceCrawlView } from "@/features/thread/components/views/SpaceCrawlView";
import { useThread } from "@/features/thread/hooks/useThread";
import { LoadingScreen, Message } from "@/shared/ui/feedback";

export const SpacePage: React.FunctionComponent = () => {
  const { threadId } = useParams({ from: "/space/$threadId" });
  const navigate = useNavigate();

  // body スクロールを完全ロック（GalleryPage と同じ方式）
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

  const { data, isLoading, error } = useThread(threadId);
  const { isPostHidden } = useNgStore();

  // 宇宙モードは没入体験のため `showNgContent` を無視し常に NG を除外する（spec §10）
  const visiblePosts = useMemo(() => {
    if (!data) return [];
    return data.posts.filter((post) => !isPostHidden(post));
  }, [data, isPostHidden]);

  const handleClose = (): void => {
    window.close();
    navigate({
      to: "/thread/$threadId",
      params: { threadId },
    }).catch(console.warn);
  };

  if (isLoading) {
    return (
      <div className="sw-scene">
        <div className="sw-starfield" aria-hidden />
        <LoadingScreen />
      </div>
    );
  }
  if (error || !data) {
    return (
      <div className="sw-scene">
        <div className="sw-starfield" aria-hidden />
        <Message variant="error">スレッドの読み込みに失敗しました</Message>
      </div>
    );
  }
  if (visiblePosts.length === 0) {
    return (
      <div className="sw-scene">
        <div className="sw-starfield" aria-hidden />
        <button
          type="button"
          className="sw-back-button"
          aria-label="閉じる"
          onClick={handleClose}
        >
          <FiX size={20} />
        </button>
        <div className="flex h-full items-center justify-center text-[color:#ffe81f]">
          表示できるレスがありません
        </div>
      </div>
    );
  }

  return (
    <div className="sw-scene">
      <title>{`スレNo.${threadId} - 宇宙モード`}</title>
      <div className="sw-starfield" aria-hidden />
      <button
        type="button"
        className="sw-back-button"
        aria-label="閉じる"
        onClick={handleClose}
      >
        <FiX size={20} />
      </button>
      <SpaceCrawlView posts={visiblePosts} />
    </div>
  );
};
