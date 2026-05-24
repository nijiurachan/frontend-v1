import type { Post } from "@/entities/post";
import { Modal } from "@/shared/ui/overlay";
import { PostListDisplay } from "../../ui";
import type { PopularPost } from "../../utils/extractPopularPosts";
import type { QuoteReferencesMap } from "../../utils/extractQuoteReferences";

interface PopularPostsModalProps {
  isOpen: boolean;
  onClose: () => void;
  posts: PopularPost[];
  quoteReferencesMap?: QuoteReferencesMap;
  allPosts?: Post[];
  onQuoteClick?: (quoteText: string) => void;
  onJumpToPost?: (postIndex: number) => void;
}

/**
 * 人気レス一覧モーダルコンポーネント
 * そうだねが付いているレスを表示する
 */
export const PopularPostsModal: React.FunctionComponent<
  PopularPostsModalProps
> = ({
  isOpen,
  onClose,
  posts,
  quoteReferencesMap,
  allPosts,
  onQuoteClick,
  onJumpToPost,
}: PopularPostsModalProps) => {
  if (posts.length === 0) {
    return (
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="人気レス"
        position="bottom"
      >
        <div className="p-8 text-center text-muted-foreground">
          そうだねが付いているレスがありません
        </div>
      </Modal>
    );
  }

  // PostListDisplay用にデータ構造を変換
  const postsForDisplay = posts.map(({ post, originalIndex }) => ({
    post,
    index: originalIndex,
  }));

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="人気レス" position="bottom">
      <PostListDisplay
        posts={postsForDisplay}
        quoteReferencesMap={quoteReferencesMap}
        allPosts={allPosts}
        onQuoteClick={onQuoteClick}
        onJumpToPost={onJumpToPost}
      />
    </Modal>
  );
};
