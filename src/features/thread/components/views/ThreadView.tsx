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
import { useHistoryStore } from "@/features/history/stores";
import { useNgStore } from "@/features/ng-filter/stores";
import { useSettingsStore } from "@/features/settings/hooks";
import type * as modals from "@/features/thread/components/modals";
import { type ActionButton, BottomActionBar } from "@/features/thread/ui";
import { useSwipeBack } from "@/shared/hooks/useSwipeBack";
import { BmgBanner } from "@/shared/ui/ad";
import {
  BOTTOM_SPACER_HEIGHT,
  LoadingScreen,
  Message,
  PULL_ZONE_HEIGHT,
  PullRefresh,
} from "@/shared/ui/feedback";
import { ModalContext } from "@/shared/ui/overlay/ModalContext";
import { useThread } from "../../hooks/useThread";
import { useReplyModalStore } from "../../stores/replyModalStore";
import { extractImages } from "../../utils/extractImages";
import { extractPopularPosts } from "../../utils/extractPopularPosts";
import { extractQuoteReferences } from "../../utils/extractQuoteReferences";
import { type SearchResult, searchPosts } from "../../utils/searchPosts";
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

interface Props {
  threadId: number;
}

export const ThreadView: React.FunctionComponent<Props> = ({
  threadId,
}: Props) => {
  const { data, isLoading, error, refetch, isFetching } = useThread(threadId);
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
  const [isQuoteSearchOpen, setIsQuoteSearchOpen] = useState(false);
  const [quoteSearchText, setQuoteSearchText] = useState("");
  const fontSize = useSettingsStore((s) => `${s.fontScalePosts}%`);

  // biome-ignore lint/correctness/useExhaustiveDependencies: スレ表示切り替え時に返信モーダルの状態をリセット
  useEffect(() => (): void => resetReplyModal(), [threadId]);

  const { isPostHidden, showNgContent } = useNgStore();

  // スレッド内の全画像を抽出（NG対応: 非表示レスの画像を除外）
  const images = useMemo(() => {
    if (!data) return [];
    const posts = showNgContent
      ? data.posts
      : data.posts.filter((post) => !isPostHidden(post));
    return extractImages(posts);
  }, [data, isPostHidden, showNgContent]);

  // 人気レス（そうだね付き）を抽出（1レス目を含む全レスから取得）
  const popularPosts = useMemo(() => {
    if (!data) return [];
    return extractPopularPosts(data.posts);
  }, [data]);

  // 引用関係マップを計算（どのレスが何回引用されているか）
  const quoteReferencesMap = useMemo(() => {
    if (!data) return new Map();
    return extractQuoteReferences(data.posts);
  }, [data]);

  // 検索処理（1レス目を含む全レスから検索）
  const handleSearch = useCallback(
    (query: string) => {
      if (!data || !query.trim()) {
        setSearchResults([]);
        return;
      }
      const results = searchPosts(data.posts, query);
      setSearchResults(results);
    },
    [data],
  );

  // 引用クリック処理
  const handleQuoteClick = useCallback((quoteText: string) => {
    setQuoteSearchText(quoteText);
    setIsQuoteSearchOpen(true);
  }, []);

  // PullRefresh の refetch コールバック
  const handleRefresh = useCallback(async () => {
    await refetch();
  }, [refetch]);

  // ページトップへスクロール（PTR ゾーンの下端 = 見かけ上の上端）
  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: PULL_ZONE_HEIGHT, behavior: "smooth" });
  }, []);

  // ページ最下部へスクロール（下端スペーサーの手前 = 見かけ上の下端）
  const scrollToBottom = useCallback(() => {
    const maxScrollY =
      document.documentElement.scrollHeight - window.innerHeight;
    const virtualBottom = maxScrollY - BOTTOM_SPACER_HEIGHT;
    window.scrollTo({
      top: Math.max(PULL_ZONE_HEIGHT, virtualBottom),
      behavior: "smooth",
    });
  }, []);

  // 指定されたレス番号の位置へスクロール
  const scrollToPost = useCallback(
    (postIndex: number) => {
      const nearest =
        data?.posts.findLast(({ id }) => id <= postIndex) ?? data?.posts[0];

      if (nearest) {
        requestAnimationFrame(() => {
          router.navigate({
            hash: `post-${nearest.id}`,
            replace: true,
            hashScrollIntoView: {
              block: "center",
            },
          });
        });
      }
    },
    [data?.posts, router.navigate],
  );

  // モーダルからレスへジャンプ
  const handleJumpToPost = useCallback(
    (postIndex: number) => {
      // すべてのモーダルを閉じる
      closeAllModals();

      // 即座にスクロール
      scrollToPost(postIndex);
    },
    [scrollToPost, closeAllModals],
  );

  // スレッドページ用のアクション
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

  // ハッシュ変更時レス番号にスクロール
  useEffect(() => {
    if (!isLoading && hash) {
      const match = hash.match(/^(?:post-)?(\d+)$/);
      if (match) {
        const postIndex = Number.parseInt(match[1], 10);
        scrollToPost(postIndex);
      }
    }
  }, [isLoading, hash, scrollToPost]);

  // Pin "now" to a single value per data update so the render stays pure.
  // Lifetime is variable server-side, so the snapshot refreshes whenever the
  // query returns new expires_at (initial fetch, refetch, pull-to-refresh).
  // Must run before any early return — Rules of Hooks.
  // biome-ignore-start lint/correctness/useExhaustiveDependencies(data?.thread): thread自体はスレ落ち表示に影響しない
  const { isThreadClosed, closureMessage, expireAtMessage, isExpiringSoon } =
    useMemo(() => {
      if (!data?.thread) {
        return {
          isThreadClosed: false,
          closureMessage: null as string | null,
          expireAtMessage: null as string | null,
          isExpiringSoon: false,
        };
      }
      // Intentionally pin "now" once per data update inside useMemo —
      // recompute is keyed on expires_at, not on Date.now() itself.
      // eslint-disable-next-line react-hooks/purity
      const now = Date.now();
      const expiresAtMs = data.thread.expires_at
        ? new Date(data.thread.expires_at).getTime()
        : null;
      const isExpired =
        !data.thread.is_permanent && expiresAtMs !== null && expiresAtMs < now;
      const isThreadClosed = data.thread.is_archived || isExpired;

      let closureMessage: string | null = null;
      let expireAtMessage: string | null = null;
      let isExpiringSoon = false;

      if (data.thread.is_archived) {
        closureMessage =
          "このスレッドはアーカイブされています。新しいレスは投稿できません。";
      } else if (data.thread.is_permanent) {
        expireAtMessage = "永久";
      } else if (isExpired) {
        closureMessage =
          "このスレッドは期限切れです。新しいレスは投稿できません。";
      } else if (expiresAtMs !== null) {
        // 期限切れまでの残り時間を計算
        const remainingMs = expiresAtMs - now;
        // 期限切れまで1時間以内なら「消えるまであとX」の警告を表示
        isExpiringSoon = remainingMs > 0 && remainingMs <= 60 * 60 * 1000;

        // 残り時間を「あとX時間Y分Z秒」の形式で表示
        const totalSeconds = Math.max(0, Math.floor(remainingMs / 1000));
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        const remainingText =
          hours >= 1
            ? `あと${hours}時間${minutes}分${seconds}秒`
            : minutes >= 1
              ? `あと${minutes}分${seconds}秒`
              : `あと${seconds}秒`;

        expireAtMessage = `${remainingText} ${new Date(expiresAtMs).toLocaleString()} 頃消えます`;
      }

      return {
        isThreadClosed,
        closureMessage,
        expireAtMessage,
        isExpiringSoon,
      };
    }, [
      data?.thread?.is_archived,
      data?.thread?.is_permanent,
      data?.thread?.expires_at,
    ]);
  // biome-ignore-end lint/correctness/useExhaustiveDependencies(data?.thread): thread自体はスレ落ち表示に影響しない

  if (isLoading) return <LoadingScreen />;

  if (error) {
    return <Message variant="error">スレッドの読み込みに失敗しました</Message>;
  }

  if (!data) return null;

  // 1レス目（スレッド本文）と2レス目以降に分割
  const [firstPost, ...remainingPosts] = data.posts;

  return (
    <>
      <title>{`${data.posts?.[0]?.plainBody.slice(0, 20) ?? `No.${threadId}`} - ${import.meta.env.APP_NAME}`}</title>
      <div ref={swipeContentRef}>
        <PullRefresh onRefresh={handleRefresh}>
          <div className="pb-14" style={{ fontSize }}>
            {firstPost && (
              <ThreadOP
                post={firstPost}
                onQuoteClick={handleQuoteClick}
                quoteReferencesMap={quoteReferencesMap}
                allPosts={data.posts}
                onJumpToPost={handleJumpToPost}
              />
            )}
            <PostList
              posts={remainingPosts}
              onQuoteClick={handleQuoteClick}
              quoteReferencesMap={quoteReferencesMap}
              allPosts={data.posts}
              onJumpToPost={handleJumpToPost}
            />
            {/* 最下レスと残り寿命表示の間の広告枠 */}
            <BmgBanner />
            {isThreadClosed && closureMessage && (
              <div className="px-4 py-4 mt-4 text-destructive text-sm bg-destructive/10 rounded">
                {closureMessage}
              </div>
            )}
            {!isThreadClosed && expireAtMessage && (
              <div
                className={`px-3 py-1.5 mx-4 text-xs rounded-md border-l-2 ${
                  isExpiringSoon
                    ? "text-destructive border-l-destructive bg-destructive/10"
                    : "text-muted-foreground border-l-primary bg-primary/5"
                }`}
              >
                {expireAtMessage}
              </div>
            )}
          </div>
        </PullRefresh>
      </div>
      <Suspense fallback={null}>
        <ReplyModal
          isOpen={isReplyOpen}
          onClose={closeReplyModal}
          threadId={threadId}
          allowImage={data.thread.allow_image_replies}
          isArchived={data.thread.is_archived}
          initialComment={replyInitialComment}
          openCount={replyOpenCount}
          contentKey={threadId}
        />
      </Suspense>
      <Suspense fallback={null}>
        <ImageListModal
          isOpen={isImageListOpen}
          onClose={(): void => setIsImageListOpen(false)}
          images={images}
          allPosts={data.posts}
          onJumpToPost={handleJumpToPost}
        />
      </Suspense>
      <Suspense fallback={null}>
        <PopularPostsModal
          isOpen={isPopularPostsOpen}
          onClose={(): void => setIsPopularPostsOpen(false)}
          posts={popularPosts}
          quoteReferencesMap={quoteReferencesMap}
          allPosts={data.posts}
          onQuoteClick={handleQuoteClick}
          onJumpToPost={handleJumpToPost}
        />
      </Suspense>
      <Suspense fallback={null}>
        <SearchModal
          isOpen={isSearchOpen}
          onClose={(): void => setIsSearchOpen(false)}
          onSearch={handleSearch}
          results={searchResults}
          isSearching={false}
          quoteReferencesMap={quoteReferencesMap}
          allPosts={data.posts}
          onQuoteClick={handleQuoteClick}
          onJumpToPost={handleJumpToPost}
        />
      </Suspense>
      <Suspense fallback={null}>
        <QuoteSearchModal
          isOpen={isQuoteSearchOpen}
          onClose={(): void => setIsQuoteSearchOpen(false)}
          quoteText={quoteSearchText}
          posts={data.posts}
          quoteReferencesMap={quoteReferencesMap}
          onQuoteClick={handleQuoteClick}
          onJumpToPost={handleJumpToPost}
        />
      </Suspense>
      <BottomActionBar actions={threadActions} primaryAction={replyAction} />
    </>
  );
};
