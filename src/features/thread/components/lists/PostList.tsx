import { useMemo } from "react";
import type { Post } from "@/entities/post";
import { useNgStore } from "@/features/ng-filter/stores";
import {
  runAimogeBeforeRender,
  useAimogeHookGeneration,
} from "@/shared/lib/aimoge";
import { usePostReadObserver } from "../../hooks/usePostReadObserver";
import type { QuoteReferencesMap } from "../../utils/extractQuoteReferences";
import { PostItem } from "./PostItem";

interface Props {
  posts: Post[];
  onQuoteClick?: (quoteText: string) => void;
  quoteReferencesMap?: QuoteReferencesMap;
  allPosts?: Post[];
  onJumpToPost?: (postIndex: number) => void;
  onPostFullyVisible?: (replyNumberInThread: number) => void;
  isArchived?: boolean;
  postContentVersion?: number;
}

export const PostList: React.FunctionComponent<Props> = ({
  posts,
  onQuoteClick,
  quoteReferencesMap,
  allPosts,
  onJumpToPost,
  onPostFullyVisible,
  isArchived = false,
  postContentVersion,
}: Props) => {
  const {
    isPostHidden,
    showNgContent,
    // enabled,
    // ngDisplayIds,
    // ngWords,
    // ngRegexes,
  } = useNgStore();

  const aimogeGeneration = useAimogeHookGeneration();
  const visiblePosts = useMemo(() => {
    void aimogeGeneration;
    const ngFilteredPosts = showNgContent
      ? posts
      : posts.filter((post) => !isPostHidden(post));
    return ngFilteredPosts.flatMap((post) => {
      const preparedPost = runAimogeBeforeRender("post:beforeRender", post);
      return preparedPost ? [preparedPost] : [];
    });
  }, [aimogeGeneration, isPostHidden, posts, showNgContent]);

  const observePostRead = usePostReadObserver(onPostFullyVisible, visiblePosts);

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
        <div key={post.id} className="relative">
          <PostItem
            post={post}
            onQuoteClick={onQuoteClick}
            quoteReferencesMap={quoteReferencesMap}
            allPosts={allPosts}
            onJumpToPost={onJumpToPost}
            isSubView={false}
            isArchived={isArchived}
            postContentVersion={postContentVersion}
            postAlreadyPrepared
          />
          <span
            ref={observePostRead(post.seq)}
            aria-hidden="true"
            className="pointer-events-none absolute bottom-0 left-0 h-px w-px"
          />
        </div>
      ))}
    </>
  );
};
