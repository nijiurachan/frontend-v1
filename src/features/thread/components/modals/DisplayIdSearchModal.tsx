import { useMemo } from "react";
import type { Post } from "@/entities/post";
import { Modal } from "@/shared/ui/overlay";
import { PostListDisplay } from "../../ui";
import type { QuoteReferencesMap } from "../../utils/extractQuoteReferences";

interface DisplayIdSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  displayId: string;
  posts: Post[];
  threadId: string;
  quoteReferencesMap?: QuoteReferencesMap;
  onQuoteClick?: (quoteText: string) => void;
}

/**
 * 特定のdisplayIdを持つレスを一覧表示するモーダル
 */
export const DisplayIdSearchModal: React.FunctionComponent<
  DisplayIdSearchModalProps
> = ({
  isOpen,
  onClose,
  displayId,
  posts,
  quoteReferencesMap,
  onQuoteClick,
}: DisplayIdSearchModalProps) => {
  // displayIdでフィルタリング
  const filteredPosts = useMemo(() => {
    return posts
      .map((post) => ({ post, index: post.seq }))
      .filter(({ post }) => post.displayId === displayId);
  }, [posts, displayId]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`ID: ${displayId}`}
      position="bottom"
    >
      <div>
        {filteredPosts.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            ID「{displayId}」のレスが見つかりませんでした
          </div>
        ) : (
          <PostListDisplay
            posts={filteredPosts}
            header={
              <div className="px-4 py-2 text-sm text-muted-foreground border-b border-border bg-card">
                ID「{displayId}」の検索結果: {filteredPosts.length}件
              </div>
            }
            quoteReferencesMap={quoteReferencesMap}
            allPosts={posts}
            onQuoteClick={onQuoteClick}
          />
        )}
      </div>
    </Modal>
  );
};
