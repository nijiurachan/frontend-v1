import { useVirtualizer } from "@tanstack/react-virtual";
import { memo, type RefObject, useEffect, useMemo, useRef } from "react";
import type { Post } from "@/entities/post";
import { useNgStore } from "@/features/ng-filter/stores";
import type { QuoteReferencesMap } from "../../utils/extractQuoteReferences";
import { PostItem } from "../lists/PostItem";

interface Props {
  posts: Post[];
  scrollElementRef: RefObject<HTMLDivElement | null>;
  quoteReferencesMap: QuoteReferencesMap;
  allPosts: Post[];
  onQuoteClick: (quoteText: string) => void;
  onJumpToPost: (postSeq: number) => void;
  onRegisterScrollToPost?: (scrollToPost: (postSeq: number) => void) => void;
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
}: Props) => {
  const { isPostHidden, showNgContent } = useNgStore();
  const visiblePosts = useMemo(
    () => (showNgContent ? posts : posts.filter((post) => !isPostHidden(post))),
    [posts, isPostHidden, showNgContent],
  );
  const listRef = useRef<HTMLDivElement>(null);
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

  useEffect(() => {
    if (!onRegisterScrollToPost) return;
    onRegisterScrollToPost((postSeq: number): void => {
      const index = visiblePosts.findIndex((post) => post.seq === postSeq);
      if (index >= 0) {
        rowVirtualizer.scrollToIndex(index, {
          align: "center",
          behavior: "smooth",
        });
      }
    });
  }, [onRegisterScrollToPost, rowVirtualizer, visiblePosts]);

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
              virtualStart={virtualRow.start}
              measureElement={(element: HTMLDivElement | null): void => {
                if (element) rowVirtualizer.measureElement(element);
              }}
              quoteReferencesMap={quoteReferencesMap}
              allPosts={allPosts}
              onQuoteClick={onQuoteClick}
              onJumpToPost={onJumpToPost}
            />
          );
        })}
      </div>
    </div>
  );
};

interface RowProps {
  post: Post;
  virtualStart: number;
  measureElement: (element: HTMLDivElement | null) => void;
  quoteReferencesMap: QuoteReferencesMap;
  allPosts: Post[];
  onQuoteClick: (quoteText: string) => void;
  onJumpToPost: (postSeq: number) => void;
}

const DesktopPostRow: React.FunctionComponent<RowProps> = memo(
  function DesktopPostRow({
    post,
    virtualStart,
    measureElement,
    quoteReferencesMap,
    allPosts,
    onQuoteClick,
    onJumpToPost,
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
        data-index={post.seq}
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
          />
        </div>
      </div>
    );
  },
);
