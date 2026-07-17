import { useLocation, useRouter } from "@tanstack/react-router";
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
import type * as modals from "@/features/thread/components/modals";
import {
  type ActionButton,
  BottomActionBar,
  NewRepliesBanner,
} from "@/features/thread/ui";
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
import { ModalContext } from "@/shared/ui/overlay/modal-context";
import { useThread } from "../../hooks/useThread";
import { useReplyModalStore } from "../../stores/replyModalStore";
import { extractImages } from "../../utils/extractImages";
import { extractPopularPosts } from "../../utils/extractPopularPosts";
import { extractQuoteReferences } from "../../utils/extractQuoteReferences";
import type { SearchResult } from "../../utils/searchPosts";
import { searchPosts } from "../../utils/searchPosts";
import { DesktopThreadView } from "../desktop/DesktopThreadView";
import { PostList } from "../lists/PostList";
import { ThreadOP } from "./ThreadOP";

// モーダルコンポーネントの遅延ロード
const ReplyModal: LazyExoticComponent<typeof modals.ReplyModal> = lazy(() =>
  import("../modals/ReplyModal").then((m) => ({ default: m.ReplyModal })),
);
const ImageListModal: LazyExoticComponent<typeof modals.ImageListModal> = lazy(
  () =>
    import("../modals/ImageListModal").then((m) => ({
      default: m.ImageListModal,
    })),
);
const PopularPostsModal: LazyExoticComponent<typeof modals.PopularPostsModal> =
  lazy(() =>
    import("../modals/PopularPostsModal").then((m) => ({
      default: m.PopularPostsModal,
    })),
  );
const SearchModal: LazyExoticComponent<typeof modals.SearchModal> = lazy(() =>
  import("../modals/SearchModal").then((m) => ({ default: m.SearchModal })),
);
const QuoteSearchModal: LazyExoticComponent<typeof modals.QuoteSearchModal> =
  lazy(() =>
    import("../modals/QuoteSearchModal").then((m) => ({
      default: m.QuoteSearchModal,
    })),
  );

/** 既読レス数の記録をページの更新・離脱時に保存する。 */
function useReadReplyNumber(threadId: string): {
  handlePostFullyVisible: (replyNumberInThread: number) => void;
  handleRefresh: () => void;
} {
  const recordReadReplyNumber = useHistoryStore((s) => s.recordReadReplyNumber);
  const fullyVisibleReplyNumberRef = useRef(0);
  const router = useRouter();

  const handlePostFullyVisible = useCallback(
    (replyNumberInThread: number): void => {
      fullyVisibleReplyNumberRef.current = replyNumberInThread;
    },
    [],
  );

  const handleRefresh = useCallback((): void => {
    recordReadReplyNumber(threadId, fullyVisibleReplyNumberRef.current);
  }, [recordReadReplyNumber, threadId]);

  useEffect(() => {
    function handlePageLeave(): void {
      recordReadReplyNumber(threadId, fullyVisibleReplyNumberRef.current);
    }

    document.addEventListener("visibilitychange", handlePageLeave);
    window.addEventListener("pagehide", handlePageLeave);
    const routerUnsubscribe = router.subscribe("onBeforeNavigate", (event) => {
      if (event.pathChanged) handlePageLeave();
    });

    return (): void => {
      routerUnsubscribe();
      window.removeEventListener("pagehide", handlePageLeave);
      document.removeEventListener("visibilitychange", handlePageLeave);
    };
  }, [recordReadReplyNumber, router, threadId]);

  return { handlePostFullyVisible, handleRefresh };
}

interface Props {
  threadId: string;
  archivedAt?: string | null;
}

const MobileThreadView: React.FunctionComponent<Props> = ({
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
  const fontSize = useSettingsStore((s) => `${s.fontScalePosts}%`);

  // biome-ignore lint/correctness/useExhaustiveDependencies: スレ切替時に返信モーダルを閉じる
  useEffect(() => (): void => resetReplyModal(), [resetReplyModal, threadId]);

  const { isPostHidden, showNgContent } = useNgStore();
  const images = useMemo(() => {
    if (!data) return [];
    const posts = showNgContent
      ? data.posts
      : data.posts.filter((post) => !isPostHidden(post));
    return extractImages(posts);
  }, [data, isPostHidden, showNgContent]);

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
      if (!query.trim() || !data) {
        setSearchResults([]);
        setIsSearching(false);
        return;
      }
      setIsSearching(true);
      if (isArchived) {
        setSearchResults(searchPosts(data.posts, query));
        setIsSearching(false);
        return;
      }
      try {
        const response = await apiGet<SearchResponse>(
          `/search?q=${encodeURIComponent(query.trim())}`,
        );
        const postIndex = new Map(
          data.posts.map((post, index) => [post.id, index]),
        );
        setSearchResults(
          response.posts
            .filter((post) => post.threadId === threadId)
            .map((post) => ({ post, index: postIndex.get(post.id) ?? -1 }))
            .filter((result) => result.index >= 0),
        );
      } catch {
        setSearchResults([]);
      } finally {
        setIsSearching(false);
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
      const hashValue = hash.replace(/^#(?:post-)?/, "");
      const post = data.posts.find(
        (candidate) =>
          candidate.id === hashValue || String(candidate.seq) === hashValue,
      );
      if (post) scrollToPost(post.seq);
    }
  }, [data, hash, isLoading, scrollToPost]);

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
}: Props) =>
  useIsDesktop() ? (
    <DesktopThreadView threadId={threadId} archivedAt={archivedAt} />
  ) : (
    <MobileThreadView threadId={threadId} archivedAt={archivedAt} />
  );
