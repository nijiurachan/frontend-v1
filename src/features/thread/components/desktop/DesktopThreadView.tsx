import { useRouter } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FiImage } from "react-icons/fi";
import type { ThreadSummary } from "@/entities/thread";
import { useHistoryStore } from "@/features/history/stores";
import { useNgStore } from "@/features/ng-filter/stores";
import { useSettingsStore } from "@/features/settings/hooks";
import { DesktopReplyPanel } from "@/features/thread/components/desktop/DesktopReplyPanel";
import { VirtualizedDesktopPostList } from "@/features/thread/components/desktop/VirtualizedDesktopPostList";
import { ImageListModal } from "@/features/thread/components/modals/ImageListModal";
import { PopularPostsModal } from "@/features/thread/components/modals/PopularPostsModal";
import { SearchModal } from "@/features/thread/components/modals/SearchModal";
import {
  ArchiveSaveActions,
  MlbTracker,
  SelectionQuoteButton,
  SpeechControls,
  ThreadMetadata,
} from "@/features/thread/components/ThreadParityTools";
import { ThreadOP } from "@/features/thread/components/views/ThreadOP";
import { useReadReplyNumber } from "@/features/thread/hooks/useReadReplyNumber";
import type { UseThreadResult } from "@/features/thread/hooks/useThread";
import {
  selectReplyInitialComment,
  selectReplyOpenCount,
  useReplyModalStore,
} from "@/features/thread/stores/replyModalStore";
import { NewRepliesBanner } from "@/features/thread/ui";
import { extractImages } from "@/features/thread/utils/extractImages";
import { extractPopularPosts } from "@/features/thread/utils/extractPopularPosts";
import { extractQuoteReferences } from "@/features/thread/utils/extractQuoteReferences";
import {
  restoreThreadScroll,
  saveThreadScroll,
} from "@/features/thread/utils/scrollPosition";
import type { SearchResult } from "@/features/thread/utils/searchPosts";
import { searchPosts } from "@/features/thread/utils/searchPosts";
import { formatThreadExpiry } from "@/features/thread/utils/threadExpiry";
import {
  initialWheelReloadState,
  recordEdgeWheel,
} from "@/features/thread/utils/wheelReload";
import { BmgBanner } from "@/shared/ui/ad";
import { LoadingScreen, Message } from "@/shared/ui/feedback";

interface Props {
  threadId: string;
  threadQuery: UseThreadResult;
}

export const DesktopThreadView: React.FunctionComponent<Props> = ({
  threadId,
  threadQuery,
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
  } = threadQuery;
  const scrollRef = useRef<HTMLElement>(null);
  const router = useRouter();
  const addViewed = useHistoryStore((state) => state.addViewed);
  const fontSize = useSettingsStore((state) => `${state.fontScalePosts}%`);
  const isPostHidden = useNgStore((state) => state.isPostHidden);
  const ngImages = useNgStore((state) => state.ngImages);
  const showNgContent = useNgStore((state) => state.showNgContent);
  const [isImageListOpen, setIsImageListOpen] = useState(false);
  const [isPopularPostsOpen, setIsPopularPostsOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
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
  const wheelStateRef = useRef(initialWheelReloadState());

  // biome-ignore lint/correctness/useExhaustiveDependencies: スレ切替時にPC返信パネルの共有状態を閉じる
  useEffect(() => (): void => resetReplyPanel(), [resetReplyPanel, threadId]);

  const quoteReferencesMap = useMemo(() => {
    return data ? extractQuoteReferences(data.posts) : new Map();
  }, [data]);
  const images = useMemo(() => {
    void ngImages;
    if (!data) return [];
    const posts = showNgContent
      ? data.posts
      : data.posts.filter((post) => !isPostHidden(post));
    return extractImages(posts);
  }, [data, isPostHidden, ngImages, showNgContent]);
  const popularPosts = useMemo(
    () => (data ? extractPopularPosts(data.posts) : []),
    [data],
  );

  useEffect(() => {
    addViewed(threadId);
  }, [addViewed, threadId]);

  // 開いた直後からキーボードスクロールが効くようスクロール領域へフォーカスする
  useEffect(() => {
    scrollRef.current?.focus({ preventScroll: true });
  }, []);

  useEffect(() => {
    const element = scrollRef.current;
    if (!element) return;
    const saved = restoreThreadScroll(
      localStorage,
      threadId,
      data?.legacyThreadId == null ? [] : [data.legacyThreadId],
    );
    if (saved !== null)
      requestAnimationFrame(() => {
        element.scrollTop = saved;
      });
    let timer = 0;
    const save = (): void => {
      window.clearTimeout(timer);
      timer = window.setTimeout(
        () => saveThreadScroll(localStorage, threadId, element.scrollTop),
        200,
      );
    };
    const wheel = (event: WheelEvent): void => {
      if (
        event.shiftKey ||
        event.altKey ||
        event.ctrlKey ||
        event.metaKey ||
        isArchived
      )
        return;
      const atEdge =
        event.deltaY < 0
          ? element.scrollTop <= 5
          : element.scrollTop + element.clientHeight >=
            element.scrollHeight - 5;
      const result = recordEdgeWheel(
        wheelStateRef.current,
        event.deltaY,
        atEdge,
      );
      wheelStateRef.current = result.state;
      if (result.reload) void refetch();
    };
    element.addEventListener("scroll", save, { passive: true });
    element.addEventListener("wheel", wheel, { passive: true });
    const finalSave = (): void =>
      saveThreadScroll(localStorage, threadId, element.scrollTop);
    addEventListener("beforeunload", finalSave);
    return (): void => {
      clearTimeout(timer);
      finalSave();
      element.removeEventListener("scroll", save);
      element.removeEventListener("wheel", wheel);
      removeEventListener("beforeunload", finalSave);
    };
  }, [data?.legacyThreadId, isArchived, refetch, threadId]);

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

  const handleModalJumpToPost = useCallback(
    (postIndex: number): void => {
      const post = data?.posts[postIndex];
      if (post) handleJumpToPost(post.seq);
      setIsPopularPostsOpen(false);
      setIsSearchOpen(false);
    },
    [data, handleJumpToPost],
  );

  const handleSearch = useCallback(
    (query: string): void => {
      setSearchResults(data ? searchPosts(data.posts, query) : []);
    },
    [data],
  );

  const scrollToTop = useCallback((): void => {
    // Dynamic row measurements make smooth scrolling drift away from zero.
    scrollRef.current?.scrollTo({ top: 0, behavior: "auto" });
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

  // スレのスクロールはページ内コンテナが担うため、素の End/Home が
  // window へ行っても何も起きない。入力中以外はスレ移動へ割り当てる。
  useEffect(() => {
    const handler = (event: KeyboardEvent): void => {
      if (event.key !== "End" && event.key !== "Home") return;
      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }
      event.preventDefault();
      if (event.key === "End") scrollToBottom();
      else scrollToTop();
    };
    window.addEventListener("keydown", handler);
    return (): void => window.removeEventListener("keydown", handler);
  }, [scrollToBottom, scrollToTop]);

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
    expiresAt: data.expiresAt,
    isPermanent: data.isPermanent,
  };

  return (
    <div className="desktop-thread-page">
      <NewRepliesBanner newCount={newPostsCount} onAccept={acceptNewPosts} />
      <ThreadMetadata body={firstPost.body} threadId={threadId} />
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
        <button type="button" onClick={(): void => setIsPopularPostsOpen(true)}>
          人気レス
        </button>
        <button type="button" onClick={(): void => setIsSearchOpen(true)}>
          検索
        </button>
        <button type="button" onClick={(): void => void handleRefresh()}>
          {isFetching ? "更新中..." : "リロード"}
        </button>
        <SpeechControls
          key={threadId}
          threadId={threadId}
          posts={data.posts}
          onAutoScroll={scrollToBottom}
        />
        {isArchived && <ArchiveSaveActions thread={data} />}
      </nav>
      {/* スクロール可能領域: tabIndex=0 で PageUp/Down・Space等の
          ネイティブスクロールキーがこのコンテナに効くようにする */}
      <section
        ref={scrollRef}
        className="desktop-thread-scroll"
        tabIndex={0}
        aria-label="スレッド本文"
      >
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
          <p className="mt-1 text-xs text-muted-foreground">
            {formatThreadExpiry(data.expiresAt, data.isPermanent)}
          </p>
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
        <MlbTracker legacyThreadId={data.legacyThreadId} />
      </section>
      <SelectionQuoteButton root={scrollRef} disabled={isArchived} />
      <div className="desktop-thread-bottom-nav">
        <button type="button" onClick={scrollToTop}>
          ▲ 上へ
        </button>
        <button type="button" onClick={scrollToBottom}>
          ▼ 下へ
        </button>
        <span>全{data.replyCount}レス</span>
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
      <PopularPostsModal
        isOpen={isPopularPostsOpen}
        onClose={(): void => setIsPopularPostsOpen(false)}
        posts={popularPosts}
        quoteReferencesMap={quoteReferencesMap}
        allPosts={data.posts}
        onQuoteClick={isArchived ? undefined : handleQuoteClick}
        onJumpToPost={handleModalJumpToPost}
        isArchived={isArchived}
      />
      <SearchModal
        isOpen={isSearchOpen}
        onClose={(): void => setIsSearchOpen(false)}
        onSearch={handleSearch}
        results={searchResults}
        isSearching={false}
        quoteReferencesMap={quoteReferencesMap}
        allPosts={data.posts}
        onQuoteClick={isArchived ? undefined : handleQuoteClick}
        onJumpToPost={handleModalJumpToPost}
        isArchived={isArchived}
      />
    </div>
  );
};
