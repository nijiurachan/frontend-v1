import { useLocation, useRouter } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FiImage } from "react-icons/fi";
import type { ThreadSummary } from "@/entities/thread";
import { useHistoryStore } from "@/features/history/stores";
import { useNgStore } from "@/features/ng-filter/stores";
import { useSettingsStore } from "@/features/settings/hooks";
import { NewRepliesBanner } from "@/features/thread/ui";
import { BmgBanner } from "@/shared/ui/ad";
import { LoadingScreen, Message } from "@/shared/ui/feedback";
import { useReadReplyNumber } from "../../hooks/useReadReplyNumber";
import { useThread } from "../../hooks/useThread";
import {
  selectReplyInitialComment,
  selectReplyOpenCount,
  useReplyModalStore,
} from "../../stores/replyModalStore";
import { extractImages } from "../../utils/extractImages";
import { extractQuoteReferences } from "../../utils/extractQuoteReferences";
import { resolvePostSeqFromHash } from "../../utils/threadHash";
import { ImageListModal } from "../modals/ImageListModal";
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
    postsContentVersion,
  } = useThread(threadId, { archivedAt });
  const scrollRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { hash } = useLocation();
  const addViewed = useHistoryStore((state) => state.addViewed);
  const fontSize = useSettingsStore((state) => `${state.fontScalePosts}%`);
  const isPostHidden = useNgStore((state) => state.isPostHidden);
  const showNgContent = useNgStore((state) => state.showNgContent);
  const [isImageListOpen, setIsImageListOpen] = useState(false);
  const replyComment = useReplyModalStore(selectReplyInitialComment);
  const replyOpenCount = useReplyModalStore(selectReplyOpenCount);
  const openReplyPanel = useReplyModalStore((state) => state.open);
  const resetReplyPanel = useReplyModalStore((state) => state.reset);
  const { handlePostFullyVisible, handleRefresh: recordReadReplyNumber } =
    useReadReplyNumber(threadId);
  const scrollToVirtualPostRef = useRef<((postSeq?: number) => void) | null>(
    null,
  );
  const pendingPostSeqRef = useRef<number | null>(null);
  const handledHashRef = useRef<string | null>(null);

  const quoteReferencesMap = useMemo(() => {
    return data ? extractQuoteReferences(data.posts) : new Map();
  }, [data]);
  const images = useMemo(() => {
    if (!data) return [];
    const posts = showNgContent
      ? data.posts
      : data.posts.filter((post) => !isPostHidden(post));
    return extractImages(posts);
  }, [data, isPostHidden, showNgContent]);

  useEffect(() => {
    addViewed(threadId);
  }, [addViewed, threadId]);

  const handleQuoteClick = useCallback(
    (quoteText: string): void => {
      openReplyPanel(`${quoteText}\n`);
    },
    [openReplyPanel],
  );

  const registerScrollToPost = useCallback(
    (scrollToPost: (postSeq?: number) => void): void => {
      scrollToVirtualPostRef.current = scrollToPost;
      if (pendingPostSeqRef.current !== null) {
        scrollToPost(pendingPostSeqRef.current);
        pendingPostSeqRef.current = null;
      }
    },
    [],
  );

  const handleJumpToPost = useCallback((postSeq: number): void => {
    if (postSeq === 0) {
      if (scrollRef.current) scrollRef.current.scrollTop = 0;
      return;
    }
    if (scrollToVirtualPostRef.current) {
      scrollToVirtualPostRef.current(postSeq);
    } else {
      pendingPostSeqRef.current = postSeq;
    }
  }, []);

  useEffect(() => {
    if (isLoading || !hash || !data) return;
    const hashKey = `${threadId}:${hash}`;
    if (handledHashRef.current === hashKey) return;
    const postSeq = resolvePostSeqFromHash(hash, data.posts);
    if (postSeq !== null) {
      handledHashRef.current = hashKey;
      handleJumpToPost(postSeq);
    }
  }, [data, handleJumpToPost, hash, isLoading, threadId]);

  const scrollToTop = useCallback((): void => {
    scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const scrollToBottom = useCallback((): void => {
    if (scrollToVirtualPostRef.current) {
      scrollToVirtualPostRef.current();
      return;
    }
    const element = scrollRef.current;
    if (element)
      element.scrollTo({ top: element.scrollHeight, behavior: "auto" });
  }, []);

  const goCatalog = useCallback((): void => {
    void router.navigate({ to: "/" });
  }, [router]);

  const handleRefresh = useCallback(async (): Promise<void> => {
    recordReadReplyNumber();
    await refetch();
  }, [recordReadReplyNumber, refetch]);

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
        <button
          type="button"
          onClick={(): void => setIsImageListOpen(true)}
          aria-label={`画像一覧を開く（${images.length}件）`}
        >
          <FiImage aria-hidden="true" />
          画像一覧
        </button>
        <button type="button" onClick={(): void => void handleRefresh()}>
          {isFetching ? "更新中..." : "リロード"}
        </button>
      </nav>
      <div ref={scrollRef} className="desktop-thread-scroll">
        <div className="desktop-thread-intro">
          <BmgBanner />
          <div className="desktop-thread-notice">
            <ul>
              {isArchived ? (
                <li>過去ログは閲覧と通報のみ利用できます</li>
              ) : (
                <>
                  <li>添付可能: GIF, JPG, PNG, WEBP, WEBM, MP4</li>
                  <li>引用行をクリックすると返信フォームへ引用できます</li>
                  <li>長いスレッドは画面近傍のレスだけを描画します</li>
                </>
              )}
            </ul>
          </div>
        </div>
        <section className="desktop-thread-op">
          <ThreadOP
            post={firstPost}
            tags={data.tags}
            onQuoteClick={isArchived ? undefined : handleQuoteClick}
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
            onQuoteClick={isArchived ? undefined : handleQuoteClick}
            onJumpToPost={handleJumpToPost}
            onRegisterScrollToPost={registerScrollToPost}
            onPostFullyVisible={handlePostFullyVisible}
            isArchived={isArchived}
            postContentVersion={postsContentVersion}
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
        onCloseComment={resetReplyPanel}
        isArchived={isArchived}
      />
      <ImageListModal
        isOpen={isImageListOpen}
        onClose={(): void => setIsImageListOpen(false)}
        images={images}
        allPosts={data.posts}
        onJumpToPost={handleJumpToPost}
        isArchived={isArchived}
      />
    </div>
  );
};
