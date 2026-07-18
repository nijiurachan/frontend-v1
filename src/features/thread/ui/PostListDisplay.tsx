import type { Post } from "@/entities/post";
import { PostItem } from "@/features/thread/components/lists/PostItem";
import type { QuoteReferencesMap } from "@/features/thread/utils/extractQuoteReferences";
import { isPostVisible } from "@/features/thread/utils/threadPosts";

interface PostListDisplayProps {
  posts: Array<{ post: Post; index: number }>;
  header?: React.ReactNode;
  quoteReferencesMap?: QuoteReferencesMap;
  allPosts?: Post[];
  onQuoteClick?: (quoteText: string) => void;
  onJumpToPost?: (postIndex: number) => void;
  isArchived?: boolean;
}

/**
 * モーダル内でのレス一覧表示用UIコンポーネント
 * SearchModal, PopularPostsModal, QuoteSearchModalなどで共通使用
 */
export const PostListDisplay: React.FunctionComponent<PostListDisplayProps> = ({
  posts,
  header,
  quoteReferencesMap,
  allPosts,
  onQuoteClick,
  onJumpToPost,
  isArchived = false,
}: PostListDisplayProps) => {
  return (
    <div className="bg-muted/30">
      {header}
      {posts
        .filter(({ post }) => isPostVisible(post.status))
        .map(({ post }) => (
          <PostItem
            key={post.id}
            post={post}
            isSubView
            quoteReferencesMap={quoteReferencesMap}
            allPosts={allPosts}
            onQuoteClick={onQuoteClick}
            onJumpToPost={onJumpToPost}
            isArchived={isArchived}
          />
        ))}
    </div>
  );
};
