import { Link, useLocation, useRouter } from "@tanstack/react-router";
import {
  type LazyExoticComponent,
  lazy,
  Suspense,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  FiArrowDown,
  FiArrowUp,
  FiFeather,
  FiImage,
  FiRefreshCw,
  FiSearch,
  FiStar,
} from "react-icons/fi";
import { HiOutlineMenu } from "react-icons/hi";
import { useSideMenu } from "@/app/layouts/SideMenuContext";
import type { SearchResponse, ThreadSummary } from "@/entities/thread";
import { useHistoryStore } from "@/features/history/stores";
import { useNgStore } from "@/features/ng-filter/stores";
import { useSettingsStore } from "@/features/settings/hooks";
import { DesktopThreadView } from "@/features/thread/components/desktop/DesktopThreadView";
import { PostList } from "@/features/thread/components/lists/PostList";
import type * as modals from "@/features/thread/components/modals";
import { ThreadOP } from "@/features/thread/components/views/ThreadOP";
import { useReadReplyNumber } from "@/features/thread/hooks/useReadReplyNumber";
import {
  type UseThreadResult,
  useThread,
} from "@/features/thread/hooks/useThread";
import { useReplyModalStore } from "@/features/thread/stores/replyModalStore";
import {
  type ActionButton,
  BottomActionBar,
  NewRepliesBanner,
} from "@/features/thread/ui";
import { extractImages } from "@/features/thread/utils/extractImages";
import { extractPopularPosts } from "@/features/thread/utils/extractPopularPosts";
import { extractQuoteReferences } from "@/features/thread/utils/extractQuoteReferences";
import {
  isAbortError,
  LatestSearchRequestGuard,
} from "@/features/thread/utils/latestSearchRequest";
import type { SearchResult } from "@/features/thread/utils/searchPosts";
import { searchPosts } from "@/features/thread/utils/searchPosts";
import { formatThreadExpiry } from "@/features/thread/utils/threadExpiry";
import { resolvePostSeqFromHash } from "@/features/thread/utils/threadHash";
import { apiGet } from "@/shared/api";
import { useIsDesktop } from "@/shared/hooks";
import { useSwipeBack } from "@/shared/hooks/useSwipeBack";
import { BmgBanner } from "@/shared/ui/ad";
import {
  BOTTOM_SPACER_HEIGHT,
  LoadingScreen,
  Message,
  PULL_ZONE_HEIGHT,
  PullRefresh,
} from "@/shared/ui/feedback";
import {
  getApiErrorMessage,
  isMissingThreadError,
} from "@/shared/ui/feedback/apiErrorMessage";
import { shouldShowThreadLoadError } from "@/shared/ui/feedback/threadLoadingState";
import { ModalContext } from "@/shared/ui/overlay/modal-context";

// モーダルコンポーネントの遅延ロード
const ReplyModal: LazyExoticComponent<typeof modals.ReplyModal> = lazy(() =>
  import("@/features/thread/components/modals/ReplyModal").then((m) => ({
    default: m.ReplyModal,
  })),
);
const ImageListModal: LazyExoticComponent<typeof modals.ImageListModal> = lazy(
  () =>
    import("@/features/thread/components/modals/ImageListModal").then((m) => ({
      default: m.ImageListModal,
    })),
);
const PopularPostsModal: LazyExoticComponent<typeof modals.PopularPostsModal> =
  lazy(() =>
    import("@/features/thread/components/modals/PopularPostsModal").then(
      (m) => ({
        default: m.PopularPostsModal,
      }),
    ),
  );
const SearchModal: LazyExoticComponent<typeof modals.SearchModal> = lazy(() =>
  import("@/features/thread/components/modals/SearchModal").then((m) => ({
    default: m.SearchModal,
  })),
);
const QuoteSearchModal: LazyExoticComponent<typeof modals.QuoteSearchModal> =
  lazy(() =>
    import("@/features/thread/components/modals/QuoteSearchModal").then(
      (m) => ({
        default: m.QuoteSearchModal,
      }),
    ),
  );

interface Props {
  threadId: string;
  archivedAt?: string | null;
}

interface MobileThreadViewProps extends Props {
  threadQuery: UseThreadResult;
}

const ThreadLoadError: React.FunctionComponent<{
  error: unknown;
  onRetry: () => void;
}> = ({ error, onRetry }: { error: unknown; onRetry: () => void }) => {
  const isMissing = isMissingThreadError(error);
  return (
    <Message variant="error" className="flex-col gap-4 px-4 text-center">
      <p>
        {isMissing
          ? "スレッドが見つかりません"
          : getApiErrorMessage(error, "スレッドの読み込みに失敗しました")}
      </p>
      {isMissing ? (
        <Link
          to="/"
          className="rounded-lg bg-primary px-4 py-2 text-primary-foreground"
        >
          カタログへ戻る
        </Link>
      ) : (
        <button
          type="button"
          className="rounded-lg bg-primary px-4 py-2 text-primary-foreground"
          onClick={onRetry}
        >
          再読み込み
        </button>
      )}
    </Message>
  );
};

const MobileThreadView: React.FunctionComponent<MobileThreadViewProps> = ({
  threadId,
  threadQuery,
}: MobileThreadViewProps) => {
  const {
    data,
    isLoading,
    refetch,
    isFetching,
    newPostsCount,
    acceptNewPosts,
    isArchived,
    postsContentVersion,
  } = threadQuery;
  const router = useRouter();
  const { hash } = useLocation();
  const { addViewed } = useHistoryStore();
  const { openSideMenu } = useSideMenu();
  const swipeContentRef = useRef<HTMLDivElement>(null);
  const handleSwipeBack = useCallback(() => {
    if (router.history.canGoBack?.()) {
      router.history.back();
    } else {
      router.navigate({ to: "/", replace: true });
    }
  }, [router]);
  useSwipeBack(handleSwipeBack, swipeContentRef);

  const { closeAllModals } = useContext(ModalContext);
  const isReplyOpen = useReplyModalStore((s) => s.isOpen);
  const replyInitialComment = useReplyModalStore((s) => s.initialComment);
  const replyOpenCount = useReplyModalStore((s) => s.openCount);
  const openReplyModal = useReplyModalStore((s) => s.open);
  const closeReplyModal = useReplyModalStore((s) => s.close);
  const resetReplyModal = useReplyModalStore((s) => s.reset);
  const [isImageListOpen, setIsImageListOpen] = useState(false);
  const [isPopularPostsOpen, setIsPopularPostsOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isQuoteSearchOpen, setIsQuoteSearchOpen] = useState(false);
  const [quoteSearchText, setQuoteSearchText] = useState("");
  const searchRequestGuardRef = useRef<LatestSearchRequestGuard | null>(null);
  if (searchRequestGuardRef.current === null) {
    searchRequestGuardRef.current = new LatestSearchRequestGuard();
  }
  const fontSize = useSettingsStore((s) => `${s.fontScalePosts}%`);

  // biome-ignore lint/correctness/useExhaustiveDependencies: スレ切替時に返信モーダルを閉じる
  useEffect(() => (): void => resetReplyModal(), [resetReplyModal, threadId]);
  // biome-ignore lint/correctness/useExhaustiveDependencies: threadId changes invalidate an in-flight search even though the cleanup reads only the stable ref
  useEffect(
    () => (): void => searchRequestGuardRef.current?.cancel(),
    [threadId],
  );

  const { isPostHidden, ngImages, showNgContent } = useNgStore();
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
  const quoteReferencesMap = useMemo(() => {
    return data ? extractQuoteReferences(data.posts) : new Map();
  }, [data]);
  const { handlePostFullyVisible, handleRefresh: handleRefreshForReplyNumber } =
    useReadReplyNumber(threadId);

  // 検索は backend-v1 の公開検索 API を使い、結果を現在のスレッドに限定する。
  const handleSearch = useCallback(
    async (query: string): Promise<void> => {
      const requestGuard = searchRequestGuardRef.current;
      if (!requestGuard) return;
      if (!query.trim() || !data) {
        requestGuard.cancel();
        setSearchResults([]);
        setIsSearching(false);
        return;
      }
      const request = requestGuard.start();
      setIsSearching(true);
      if (isArchived) {
        if (requestGuard.isCurrent(request)) {
          setSearchResults(searchPosts(data.posts, query));
          setIsSearching(false);
        }
        requestGuard.finish(request);
        return;
      }
      try {
        const response = await apiGet<SearchResponse>(
          `/search?q=${encodeURIComponent(query.trim())}`,
          { signal: request.signal },
        );
        if (!requestGuard.isCurrent(request)) return;
        const postIndex = new Map(
          data.posts.map((post, index) => [post.id, index]),
        );
        setSearchResults(
          response.posts
            .filter((post) => post.threadId === threadId)
            .map((post) => ({ post, index: postIndex.get(post.id) ?? -1 }))
            .filter((result) => result.index >= 0),
        );
      } catch (error) {
        if (!isAbortError(error) && requestGuard.isCurrent(request)) {
          setSearchResults([]);
        }
      } finally {
        if (requestGuard.isCurrent(request)) setIsSearching(false);
        requestGuard.finish(request);
      }
    },
    [data, isArchived, threadId],
  );

  const handleQuoteClick = useCallback((quoteText: string) => {
    setQuoteSearchText(quoteText);
    setIsQuoteSearchOpen(true);
  }, []);

  const handleRefresh = useCallback(async () => {
    handleRefreshForReplyNumber();
    await refetch();
  }, [handleRefreshForReplyNumber, refetch]);

  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: PULL_ZONE_HEIGHT, behavior: "smooth" });
  }, []);

  const scrollToBottom = useCallback(() => {
    const maxScrollY =
      document.documentElement.scrollHeight - window.innerHeight;
    const virtualBottom = maxScrollY - BOTTOM_SPACER_HEIGHT;
    window.scrollTo({
      top: Math.max(PULL_ZONE_HEIGHT, virtualBottom),
      behavior: "smooth",
    });
  }, []);

  const scrollToPost = useCallback(
    (postSeq: number) => {
      const nearest =
        data?.posts.findLast(({ seq }) => seq <= postSeq) ?? data?.posts[0];
      if (nearest) {
        requestAnimationFrame(() => {
          router.navigate({
            hash: `post-${nearest.id}`,
            replace: true,
            hashScrollIntoView: { block: "center" },
          });
        });
      }
    },
    [data?.posts, router],
  );

  const handleJumpToPost = useCallback(
    (postSeq: number) => {
      closeAllModals();
      scrollToPost(postSeq);
    },
    [scrollToPost, closeAllModals],
  );

  const threadActions: ActionButton[] = [
    { icon: HiOutlineMenu, label: "メニュー", onClick: openSideMenu },
    {
      icon: FiStar,
      label: "お気に入り",
      onClick: () => setIsPopularPostsOpen(true),
    },
    { icon: FiArrowUp, label: "上へ", onClick: scrollToTop },
    { icon: FiArrowDown, label: "下へ", onClick: scrollToBottom },
    {
      icon: FiImage,
      label: "画像一覧",
      onClick: () => setIsImageListOpen(true),
    },
    {
      icon: FiRefreshCw,
      label: "更新",
      onClick: refetch,
      isLoading: isFetching,
    },
    { icon: FiSearch, label: "検索", onClick: () => setIsSearchOpen(true) },
  ];
  const replyAction = {
    icon: FiFeather,
    label: "返信",
    onClick: (): void => openReplyModal(""),
  };

  useEffect(() => {
    if (threadId) addViewed(threadId);
  }, [threadId, addViewed]);

  useEffect(() => {
    if (!isLoading && hash && data) {
      const postSeq = resolvePostSeqFromHash(hash, data.posts);
      if (postSeq !== null) scrollToPost(postSeq);
    }
  }, [data, hash, isLoading, scrollToPost]);

  if (!data) return <LoadingScreen message="スレッドを表示しています..." />;

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
    <>
      <NewRepliesBanner newCount={newPostsCount} onAccept={acceptNewPosts} />
      <title>{`${firstPost.body.slice(0, 20) || `No.${threadId}`} - ${import.meta.env.APP_NAME}`}</title>
      <div ref={swipeContentRef}>
        <PullRefresh onRefresh={handleRefresh}>
          <div className="pb-14" style={{ fontSize }}>
            <ThreadOP
              post={firstPost}
              tags={data.tags}
              onQuoteClick={isArchived ? undefined : handleQuoteClick}
              quoteReferencesMap={quoteReferencesMap}
              allPosts={data.posts}
              onJumpToPost={handleJumpToPost}
              isArchived={isArchived}
            />
            <p className="px-3 pb-2 text-xs text-muted-foreground">
              {formatThreadExpiry(data.expiresAt, data.isPermanent)}
            </p>
            <PostList
              posts={remainingPosts}
              onQuoteClick={isArchived ? undefined : handleQuoteClick}
              quoteReferencesMap={quoteReferencesMap}
              allPosts={data.posts}
              onJumpToPost={handleJumpToPost}
              onPostFullyVisible={handlePostFullyVisible}
              isArchived={isArchived}
              postContentVersion={postsContentVersion}
            />
            <BmgBanner />
          </div>
        </PullRefresh>
      </div>
      <Suspense fallback={null}>
        <ReplyModal
          isOpen={isReplyOpen}
          onClose={closeReplyModal}
          thread={threadSummary}
          initialComment={replyInitialComment}
          openCount={replyOpenCount}
          contentKey={threadId}
          isArchived={isArchived}
        />
      </Suspense>
      <Suspense fallback={null}>
        <ImageListModal
          isOpen={isImageListOpen}
          onClose={(): void => setIsImageListOpen(false)}
          images={images}
          allPosts={data.posts}
          onJumpToPost={handleJumpToPost}
          isArchived={isArchived}
        />
      </Suspense>
      <Suspense fallback={null}>
        <PopularPostsModal
          isOpen={isPopularPostsOpen}
          onClose={(): void => setIsPopularPostsOpen(false)}
          posts={popularPosts}
          quoteReferencesMap={quoteReferencesMap}
          allPosts={data.posts}
          onQuoteClick={isArchived ? undefined : handleQuoteClick}
          onJumpToPost={handleJumpToPost}
          isArchived={isArchived}
        />
      </Suspense>
      <Suspense fallback={null}>
        <SearchModal
          isOpen={isSearchOpen}
          onClose={(): void => setIsSearchOpen(false)}
          onSearch={handleSearch}
          results={searchResults}
          isSearching={isSearching}
          quoteReferencesMap={quoteReferencesMap}
          allPosts={data.posts}
          onQuoteClick={isArchived ? undefined : handleQuoteClick}
          onJumpToPost={handleJumpToPost}
          isArchived={isArchived}
        />
      </Suspense>
      <Suspense fallback={null}>
        <QuoteSearchModal
          isOpen={isQuoteSearchOpen}
          onClose={(): void => setIsQuoteSearchOpen(false)}
          quoteText={quoteSearchText}
          posts={data.posts}
          quoteReferencesMap={quoteReferencesMap}
          onQuoteClick={isArchived ? undefined : handleQuoteClick}
          onJumpToPost={handleJumpToPost}
          isArchived={isArchived}
        />
      </Suspense>
      <BottomActionBar
        actions={threadActions}
        primaryAction={isArchived ? undefined : replyAction}
      />
    </>
  );
};

export const ThreadView: React.FunctionComponent<Props> = ({
  threadId,
  archivedAt,
}: Props) => {
  const isDesktop = useIsDesktop();
  const threadQuery = useThread(threadId, { archivedAt });

  if (threadQuery.isLoading) {
    return <LoadingScreen message="スレッドを読み込み中..." />;
  }
  if (shouldShowThreadLoadError(threadQuery.error, Boolean(threadQuery.data))) {
    return (
      <ThreadLoadError
        error={threadQuery.error}
        onRetry={(): void => void threadQuery.refetch()}
      />
    );
  }
  if (!threadQuery.data) {
    return <LoadingScreen message="スレッドを表示しています..." />;
  }

  return isDesktop ? (
    <DesktopThreadView threadId={threadId} threadQuery={threadQuery} />
  ) : (
    <MobileThreadView threadId={threadId} threadQuery={threadQuery} />
  );
};
