import type { Post } from "@/entities/post";
import { PostItem } from "../components/lists/PostItem";
import type { QuoteReferencesMap } from "../utils/extractQuoteReferences";

interface PostListDisplayProps {
  posts: Array<{ post: Post; index: number }>;
  header?: React.ReactNode;
  quoteReferencesMap?: QuoteReferencesMap;
  allPosts?: Post[];
  onQuoteClick?: (quoteText: string) => void;
  onJumpToPost?: (postIndex: number) => void;
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
}: PostListDisplayProps) => {
  return (
    <div className="bg-muted/30">
      {header}
      {posts.map(({ post }) => (
        <PostItem
          key={post.id}
          post={post}
          isSubView
          quoteReferencesMap={quoteReferencesMap}
          allPosts={allPosts}
          onQuoteClick={onQuoteClick}
          onJumpToPost={onJumpToPost}
        />
      ))}
    </div>
  );
};
