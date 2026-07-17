import { useRouter } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ThreadSummary } from "@/entities/thread";
import { useHistoryStore } from "@/features/history/stores";
import { useSettingsStore } from "@/features/settings/hooks";
import { NewRepliesBanner } from "@/features/thread/ui";
import { BmgBanner } from "@/shared/ui/ad";
import { LoadingScreen, Message } from "@/shared/ui/feedback";
import { useThread } from "../../hooks/useThread";
import { extractQuoteReferences } from "../../utils/extractQuoteReferences";
import { ThreadOP } from "../views/ThreadOP";
import { DesktopReplyPanel } from "./DesktopReplyPanel";
import { VirtualizedDesktopPostList } from "./VirtualizedDesktopPostList";

interface Props {
  threadId: string;
  archivedAt?: string | null;
}

export const DesktopThreadView: React.FunctionComponent<Props> = ({
  threadId,
  archivedAt,
}: Props) => {
  const {
    data,
    isLoading,
    error,
    refetch,
    isFetching,
    newPostsCount,
    acceptNewPosts,
    isArchived,
  } = useThread(threadId, { archivedAt });
  const scrollRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const addViewed = useHistoryStore((state) => state.addViewed);
  const fontSize = useSettingsStore((state) => `${state.fontScalePosts}%`);
  const [replyComment, setReplyComment] = useState("");
  const [replyOpenCount, setReplyOpenCount] = useState(0);
  const scrollToVirtualPostRef = useRef<((postSeq: number) => void) | null>(
    null,
  );

  const quoteReferencesMap = useMemo(
    () => (data ? extractQuoteReferences(data.posts) : new Map()),
    [data],
  );

  useEffect(() => {
    addViewed(threadId);
  }, [addViewed, threadId]);

  const handleQuoteClick = useCallback((quoteText: string): void => {
    setReplyComment(`${quoteText}\n`);
    setReplyOpenCount((count) => count + 1);
  }, []);

  const registerScrollToPost = useCallback(
    (scrollToPost: (postSeq: number) => void): void => {
      scrollToVirtualPostRef.current = scrollToPost;
    },
    [],
  );

  const handleJumpToPost = useCallback((postSeq: number): void => {
    if (postSeq === 0) {
      if (scrollRef.current) scrollRef.current.scrollTop = 0;
      return;
    }
    scrollToVirtualPostRef.current?.(postSeq);
  }, []);

  const scrollToTop = useCallback((): void => {
    scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const scrollToBottom = useCallback((): void => {
    const element = scrollRef.current;
    if (element)
      element.scrollTo({ top: element.scrollHeight, behavior: "smooth" });
  }, []);

  const goCatalog = useCallback((): void => {
    void router.navigate({ to: "/" });
  }, [router]);

  if (isLoading) return <LoadingScreen />;
  if (error) {
    return <Message variant="error">スレッドの読み込みに失敗しました</Message>;
  }
  if (!data) return null;

  const [firstPost, ...remainingPosts] = data.posts;
  if (!firstPost) return <Message variant="info">レスがありません</Message>;

  const threadSummary: ThreadSummary = {
    id: data.id,
    opPost: firstPost,
    replyCount: data.replyCount,
    createdAt: data.createdAt,
    bumpedAt: data.bumpedAt,
    tags: data.tags,
    closedAt: data.closedAt,
    allowImageReplies: data.allowImageReplies,
  };

  return (
    <div className="desktop-thread-page">
      <NewRepliesBanner newCount={newPostsCount} onAccept={acceptNewPosts} />
      <title>{`${firstPost.body.slice(0, 20) || `No.${threadId}`} - ${import.meta.env.APP_NAME}`}</title>
      <nav className="desktop-thread-nav" aria-label="スレッドナビゲーション">
        [
        <button type="button" onClick={goCatalog}>
          掲示板に戻る
        </button>
        ]
        <button type="button" onClick={goCatalog}>
          カタログ
        </button>
        <button type="button" onClick={scrollToTop}>
          ▲最上部へ
        </button>
        <button type="button" onClick={scrollToBottom}>
          ▼最下部へ
        </button>
        <button type="button" onClick={(): void => void refetch()}>
          {isFetching ? "更新中..." : "リロード"}
        </button>
      </nav>
      <div ref={scrollRef} className="desktop-thread-scroll">
        <div className="desktop-thread-intro">
          <BmgBanner />
          <div className="desktop-thread-notice">
            <ul>
              <li>添付可能: GIF, JPG, PNG, WEBP, WEBM, MP4</li>
              <li>引用行をクリックすると返信フォームへ引用できます</li>
              <li>長いスレッドは画面近傍のレスだけを描画します</li>
            </ul>
          </div>
        </div>
        <section className="desktop-thread-op">
          <ThreadOP
            post={firstPost}
            tags={data.tags}
            onQuoteClick={handleQuoteClick}
            quoteReferencesMap={quoteReferencesMap}
            allPosts={data.posts}
            onJumpToPost={handleJumpToPost}
            isArchived={isArchived}
          />
        </section>
        <div style={{ fontSize }}>
          <VirtualizedDesktopPostList
            posts={remainingPosts}
            scrollElementRef={scrollRef}
            quoteReferencesMap={quoteReferencesMap}
            allPosts={data.posts}
            onQuoteClick={handleQuoteClick}
            onJumpToPost={handleJumpToPost}
            onRegisterScrollToPost={registerScrollToPost}
            isArchived={isArchived}
          />
        </div>
        <BmgBanner />
      </div>
      <div className="desktop-thread-bottom-nav">
        <button type="button" onClick={scrollToTop}>
          ▲ 上へ
        </button>
        <button type="button" onClick={scrollToBottom}>
          ▼ 下へ
        </button>
        <span>{data.replyCount}レス / 仮想化表示</span>
      </div>
      <DesktopReplyPanel
        thread={threadSummary}
        initialComment={replyComment}
        openCount={replyOpenCount}
        onCloseComment={(): void => setReplyComment("")}
        isArchived={isArchived}
      />
    </div>
  );
};
