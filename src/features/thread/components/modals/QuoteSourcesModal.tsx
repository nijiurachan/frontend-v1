import type { Post } from "@/entities/post";
import { Modal } from "@/shared/ui/overlay";
import { PostListDisplay } from "../../ui";
import type { QuoteReferencesMap } from "../../utils/extractQuoteReferences";

interface QuoteSourcesModalProps {
  isOpen: boolean;
  onClose: () => void;
  sourceIndexes: number[];
  posts: Post[];
  threadId: string;
  quoteReferencesMap?: QuoteReferencesMap;
  onQuoteClick?: (quoteText: string) => void;
  onJumpToPost?: (postIndex: number) => void;
  isArchived?: boolean;
}

/**
 * 引用元一覧モーダルコンポーネント
 * あるレスを引用している元レスの一覧を表示する
 */
export const QuoteSourcesModal: React.FunctionComponent<
  QuoteSourcesModalProps
> = ({
  isOpen,
  onClose,
  sourceIndexes,
  posts,
  quoteReferencesMap,
  onQuoteClick,
  onJumpToPost,
  isArchived = false,
}: QuoteSourcesModalProps) => {
  // 引用元レスのリストを作成
  const sourcePosts = sourceIndexes
    .map((index) => ({
      post: posts[index],
      index,
    }))
    .filter((item) => item.post); // 存在しないインデックスを除外

  if (sourcePosts.length === 0) {
    return (
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="引用元レス"
        position="bottom"
      >
        <div className="p-8 text-center text-muted-foreground">
          引用元のレスがありません
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="引用元レス"
      position="bottom"
    >
      <PostListDisplay
        posts={sourcePosts}
        header={
          <div className="px-4 py-2 text-sm text-muted-foreground border-b border-border bg-card">
            このレスを引用しているレス: {sourcePosts.length}件
          </div>
        }
        quoteReferencesMap={quoteReferencesMap}
        allPosts={posts}
        onQuoteClick={onQuoteClick}
        onJumpToPost={onJumpToPost}
        isArchived={isArchived}
      />
    </Modal>
  );
};
