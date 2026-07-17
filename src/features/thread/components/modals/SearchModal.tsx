import { useEffect, useState } from "react";
import { FiSearch } from "react-icons/fi";
import type { Post } from "@/entities/post";
import { Modal } from "@/shared/ui/overlay";
import { PostListDisplay } from "../../ui";
import type { QuoteReferencesMap } from "../../utils/extractQuoteReferences";
import type { SearchResult } from "../../utils/searchPosts";

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSearch: (query: string) => void;
  results: SearchResult[];
  isSearching: boolean;
  quoteReferencesMap?: QuoteReferencesMap;
  allPosts?: Post[];
  onQuoteClick?: (quoteText: string) => void;
  onJumpToPost?: (postIndex: number) => void;
  isArchived?: boolean;
}

/**
 * スレッド内検索モーダルコンポーネント
 * リアルタイム検索機能を提供
 */
export const SearchModal: React.FunctionComponent<SearchModalProps> = ({
  isOpen,
  onClose,
  onSearch,
  results,
  quoteReferencesMap,
  allPosts,
  onQuoteClick,
  onJumpToPost,
  isArchived = false,
}: SearchModalProps) => {
  const [query, setQuery] = useState("");
  const [lastSearchedQuery, setLastSearchedQuery] = useState("");

  // リアルタイム検索（debounce: 300ms）
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    if (!query.trim()) {
      onSearch("");
      return;
    }

    const timer = setTimeout(() => {
      onSearch(query);
      setLastSearchedQuery(query);
    }, 300);

    return (): void => clearTimeout(timer);
  }, [query, isOpen, onSearch]);

  const handleClose = (): void => {
    setQuery("");
    setLastSearchedQuery("");
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="検索" position="bottom">
      <div className="sticky top-0 bg-card border-b border-border p-4 z-10">
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={(
              e: React.ChangeEvent<HTMLInputElement, HTMLInputElement>,
            ): void => setQuery(e.target.value)}
            placeholder="レスを検索..."
            className="w-full px-4 py-2 pr-10 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <FiSearch className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        </div>
      </div>

      <div>
        {!query.trim() ? (
          <div className="p-8 text-center text-muted-foreground">
            キーワードを入力してください
          </div>
        ) : lastSearchedQuery !== query ? (
          <div className="p-8 text-center text-muted-foreground">検索中...</div>
        ) : results.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            「{query}」に一致するレスが見つかりませんでした
          </div>
        ) : (
          <PostListDisplay
            posts={results}
            header={
              <div className="px-4 py-2 text-sm text-muted-foreground border-b border-border bg-card">
                「{query}」の検索結果: {results.length}件
              </div>
            }
            quoteReferencesMap={quoteReferencesMap}
            allPosts={allPosts}
            onQuoteClick={onQuoteClick}
            onJumpToPost={onJumpToPost}
            isArchived={isArchived}
          />
        )}
      </div>
    </Modal>
  );
};
