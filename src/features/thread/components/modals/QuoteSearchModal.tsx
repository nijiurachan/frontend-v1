import { useMemo } from "react";
import type { Post } from "@/entities/post";
import { Modal } from "@/shared/ui/overlay";
import { PostListDisplay } from "../../ui";
import type { QuoteReferencesMap } from "../../utils/extractQuoteReferences";
import type { SearchResult } from "../../utils/searchPosts";

interface QuoteSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  quoteText: string;
  posts: Post[];
  quoteReferencesMap?: QuoteReferencesMap;
  onQuoteClick?: (quoteText: string) => void;
  onJumpToPost?: (postIndex: number) => void;
  isArchived?: boolean;
}

/**
 * 引用検索モーダルコンポーネント
 * 引用文をクリックしたときに、その内容でレスを検索して表示
 */
export const QuoteSearchModal: React.FunctionComponent<
  QuoteSearchModalProps
> = ({
  isOpen,
  onClose,
  quoteText,
  posts,
  quoteReferencesMap,
  onQuoteClick,
  onJumpToPost,
  isArchived = false,
}: QuoteSearchModalProps) => {
  // 引用テキストから検索クエリを抽出（&gt;を除去してデコード）
  const searchQuery = useMemo(() => {
    if (!quoteText) return "";
    // &gt; を除去してプレーンテキストに変換
    return quoteText.replace(/^>/g, "").trim();
  }, [quoteText]);

  // 引用部分を除外した検索（ファイル名も含む）
  const results: SearchResult[] = useMemo(() => {
    if (!searchQuery) return [];

    const lowerQuery = searchQuery.toLowerCase();
    const searchResults: SearchResult[] = [];

    posts.forEach((post, index) => {
      // 全レス・ファイル名・レスNoから検索
      // TODO QuoteReferenceMapを利用
      const content = [
        `No.${post.seq}`,
        post.attachment?.originalUrl,
        post.body,
      ]
        .join("\n")
        .toLowerCase();

      if (content.includes(lowerQuery)) {
        searchResults.push({ post, index });
      }
    });

    return searchResults;
  }, [posts, searchQuery]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="引用レス" position="bottom">
      <div>
        {!searchQuery ? (
          <div className="p-8 text-center text-muted-foreground">
            引用文が選択されていません
          </div>
        ) : results.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            引用元のレスが見つかりません
          </div>
        ) : (
          <PostListDisplay
            posts={results}
            quoteReferencesMap={quoteReferencesMap}
            allPosts={posts}
            onQuoteClick={onQuoteClick}
            onJumpToPost={onJumpToPost}
            isArchived={isArchived}
          />
        )}
      </div>
    </Modal>
  );
};
