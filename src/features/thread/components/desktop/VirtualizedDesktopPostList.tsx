import { useLocation } from "@tanstack/react-router";
import { useVirtualizer } from "@tanstack/react-virtual";
import {
  memo,
  type RefObject,
  useCallback,
  useEffect,
  useMemo,
  useRef,
} from "react";
import type { Post } from "@/entities/post";
import { useNgStore } from "@/features/ng-filter/stores";
import { PostItem } from "@/features/thread/components/lists/PostItem";
import { usePostReadObserver } from "@/features/thread/hooks/usePostReadObserver";
import type { QuoteReferencesMap } from "@/features/thread/utils/extractQuoteReferences";
import { resolvePostSeqFromHash } from "@/features/thread/utils/threadHash";
import {
  runAimogeBeforeRender,
  useAimogeHookGeneration,
} from "@/shared/lib/aimoge";

interface Props {
  posts: Post[];
  scrollElementRef: RefObject<HTMLElement | null>;
  quoteReferencesMap: QuoteReferencesMap;
  allPosts: Post[];
  onQuoteClick?: (quoteText: string) => void;
  onJumpToPost: (postSeq: number) => void;
  onRegisterScrollToPost?: (scrollToPost: (postSeq?: number) => void) => void;
  onPostFullyVisible?: (replyNumberInThread: number) => void;
  isArchived?: boolean;
  postContentVersion?: number;
}

/**
 * デスクトップ用の長スレ窓化。
 * 1000レスでもDOMには画面近傍の数十行だけを置き、各行の実寸は
 * measureElementで再計測する。投稿の内容自体は既存のmemo済みPostItemへ委譲する。
 */
export const VirtualizedDesktopPostList: React.FunctionComponent<Props> = ({
  posts,
  scrollElementRef,
  quoteReferencesMap,
  allPosts,
  onQuoteClick,
  onJumpToPost,
  onRegisterScrollToPost,
  onPostFullyVisible,
  isArchived = false,
  postContentVersion,
}: Props) => {
  const { isPostHidden, showNgContent } = useNgStore();
  const aimogeGeneration = useAimogeHookGeneration();
  const { hash } = useLocation();
  const visiblePosts = useMemo(() => {
    void aimogeGeneration;
    const ngFilteredPosts = showNgContent
      ? posts
      : posts.filter((post) => !isPostHidden(post));
    return ngFilteredPosts.flatMap((post) => {
      const preparedPost = runAimogeBeforeRender("post:beforeRender", post);
      return preparedPost ? [preparedPost] : [];
    });
  }, [aimogeGeneration, posts, isPostHidden, showNgContent]);
  const observePostRead = usePostReadObserver(onPostFullyVisible, visiblePosts);
  const listRef = useRef<HTMLDivElement>(null);
  const handledHashRef = useRef<string | null>(null);
  // TanStack Virtual intentionally exposes an imperative virtualizer API.
  // eslint-disable-next-line react-hooks/incompatible-library
  const rowVirtualizer = useVirtualizer({
    count: visiblePosts.length,
    getScrollElement: () => scrollElementRef.current,
    estimateSize: () => 96,
    overscan: 8,
    getItemKey: (index: number) => visiblePosts[index]?.id ?? index,
    measureElement: (element: HTMLElement): number =>
      element.getBoundingClientRect().height,
  });
  const measureElement = useCallback(
    (element: HTMLDivElement | null): void => {
      if (element) rowVirtualizer.measureElement(element);
    },
    [rowVirtualizer],
  );

  useEffect(() => {
    if (!onRegisterScrollToPost) return;
    onRegisterScrollToPost((postSeq?: number): void => {
      const index =
        postSeq === undefined
          ? visiblePosts.length - 1
          : visiblePosts.findIndex((post) => post.seq === postSeq);
      if (index >= 0) {
        rowVirtualizer.scrollToIndex(index, {
          align: "center",
          // Smooth scrolling is incompatible with dynamically measured rows:
          // measurements change the target offset while the animation runs.
          behavior: "auto",
        });
      }
    });
  }, [onRegisterScrollToPost, rowVirtualizer, visiblePosts]);

  useEffect(() => {
    if (!hash) {
      handledHashRef.current = null;
      return;
    }
    const postSeq = resolvePostSeqFromHash(hash, allPosts);
    if (postSeq === null) return;
    const hashKey = `${allPosts[0]?.threadId ?? "unknown"}:${hash}:${postSeq}`;
    if (handledHashRef.current === hashKey) return;
    if (postSeq === 0) {
      if (scrollElementRef.current) scrollElementRef.current.scrollTop = 0;
      handledHashRef.current = hashKey;
      return;
    }
    const index = visiblePosts.findIndex((post) => post.seq === postSeq);
    if (index < 0) return;

    const frame = window.requestAnimationFrame(() => {
      rowVirtualizer.scrollToIndex(index, {
        align: "center",
        behavior: "auto",
      });
      handledHashRef.current = hashKey;
    });
    return (): void => window.cancelAnimationFrame(frame);
  }, [allPosts, hash, rowVirtualizer, scrollElementRef, visiblePosts]);

  if (visiblePosts.length === 0) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        {posts.length > 0
          ? "NGフィルターにより、すべてのレスが非表示になっています"
          : "まだレスがありません"}
      </div>
    );
  }

  return (
    <div ref={listRef} className="desktop-thread-post-list">
      <div
        className="desktop-thread-post-list-inner"
        style={{ height: rowVirtualizer.getTotalSize() }}
      >
        {rowVirtualizer.getVirtualItems().map((virtualRow) => {
          const post = visiblePosts[virtualRow.index];
          if (!post) return null;
          return (
            <DesktopPostRow
              key={virtualRow.key}
              post={post}
              virtualIndex={virtualRow.index}
              virtualStart={virtualRow.start}
              measureElement={measureElement}
              quoteReferencesMap={quoteReferencesMap}
              allPosts={allPosts}
              onQuoteClick={onQuoteClick}
              onJumpToPost={onJumpToPost}
              readSentinelRef={observePostRead(post.seq)}
              isArchived={isArchived}
              postContentVersion={postContentVersion}
            />
          );
        })}
      </div>
    </div>
  );
};

interface RowProps {
  post: Post;
  virtualIndex: number;
  virtualStart: number;
  measureElement: (element: HTMLDivElement | null) => void;
  quoteReferencesMap: QuoteReferencesMap;
  allPosts: Post[];
  onQuoteClick?: (quoteText: string) => void;
  onJumpToPost: (postSeq: number) => void;
  readSentinelRef: (element: HTMLSpanElement | null) => void;
  isArchived: boolean;
  postContentVersion?: number;
}

const DesktopPostRow: React.FunctionComponent<RowProps> = memo(
  function DesktopPostRow({
    post,
    virtualIndex,
    virtualStart,
    measureElement,
    quoteReferencesMap,
    allPosts,
    onQuoteClick,
    onJumpToPost,
    readSentinelRef,
    isArchived,
    postContentVersion,
  }: RowProps) {
    const quoteDepth = Math.min(
      3,
      Math.max(
        0,
        ...post.body
          .split(/\r?\n/)
          .filter((line) => line.startsWith(">"))
          .map((line) => (line.match(/^>+/)?.[0].length ?? 1) - 1),
      ),
    );

    return (
      <div
        ref={measureElement}
        data-index={virtualIndex}
        className="desktop-thread-post-row"
        style={{ transform: `translateY(${virtualStart}px)` }}
      >
        <div className={`desktop-indent-${quoteDepth}`}>
          <PostItem
            post={post}
            quoteReferencesMap={quoteReferencesMap}
            allPosts={allPosts}
            onQuoteClick={onQuoteClick}
            isSubView={false}
            onJumpToPost={onJumpToPost}
            isArchived={isArchived}
            postContentVersion={postContentVersion}
            postAlreadyPrepared
          />
        </div>
        <span
          ref={readSentinelRef}
          aria-hidden="true"
          className="pointer-events-none absolute bottom-0 left-0 h-px w-px"
        />
      </div>
    );
  },
  areDesktopPostRowPropsEqual,
);

function areDesktopPostRowPropsEqual(
  previous: RowProps,
  next: RowProps,
): boolean {
  if (
    previous.post !== next.post ||
    previous.virtualIndex !== next.virtualIndex ||
    previous.virtualStart !== next.virtualStart ||
    previous.measureElement !== next.measureElement ||
    previous.onQuoteClick !== next.onQuoteClick ||
    previous.onJumpToPost !== next.onJumpToPost ||
    previous.readSentinelRef !== next.readSentinelRef ||
    previous.isArchived !== next.isArchived ||
    previous.postContentVersion !== next.postContentVersion
  ) {
    return false;
  }
  if (previous.postContentVersion !== undefined) return true;
  return (
    previous.quoteReferencesMap === next.quoteReferencesMap &&
    previous.allPosts === next.allPosts
  );
}
