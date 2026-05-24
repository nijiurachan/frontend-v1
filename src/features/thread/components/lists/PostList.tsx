import { useMemo } from "react";
import type { Post } from "@/entities/post";
import { useNgStore } from "@/features/ng-filter/stores";
import type { QuoteReferencesMap } from "../../utils/extractQuoteReferences";
import { PostItem } from "./PostItem";

interface Props {
  posts: Post[];
  onQuoteClick?: (quoteText: string) => void;
  quoteReferencesMap?: QuoteReferencesMap;
  allPosts?: Post[];
  onJumpToPost?: (postIndex: number) => void;
}

export const PostList: React.FunctionComponent<Props> = ({
  posts,
  onQuoteClick,
  quoteReferencesMap,
  allPosts,
  onJumpToPost,
}: Props) => {
  const {
    isPostHidden,
    showNgContent,
    // enabled,
    // ngDisplayIds,
    // ngWords,
    // ngRegexes,
  } = useNgStore();

  const visiblePosts = useMemo(() => {
    // showNgContentがtrueの場合はフィルタリングしない
    if (showNgContent) return posts;
    return posts.filter((post) => !isPostHidden(post));
  }, [posts, isPostHidden, showNgContent]);

  // showNgContentがfalseで、すべてのレスがフィルタリングされた場合
  if (!showNgContent && visiblePosts.length === 0 && posts.length > 0) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        NGフィルターにより、すべてのレスが非表示になっています
      </div>
    );
  }

  if (visiblePosts.length === 0) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        まだレスがありません
      </div>
    );
  }

  return (
    <>
      {visiblePosts.map((post) => (
        <PostItem
          key={post.id}
          post={post}
          onQuoteClick={onQuoteClick}
          quoteReferencesMap={quoteReferencesMap}
          allPosts={allPosts}
          onJumpToPost={
            onJumpToPost ? (): void => onJumpToPost(post.id) : undefined
          }
          isSubView={false}
        />
      ))}
    </>
  );
};
