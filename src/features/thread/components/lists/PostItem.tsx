import clsx from "clsx";
import { memo, useState } from "react";
import { MdBlock, MdExpandMore } from "react-icons/md";
import type { Post } from "@/entities/post";
import { useNgStore } from "@/features/ng-filter/stores";
import type { QuoteReferencesMap } from "../../utils/extractQuoteReferences";
import { PostDisplay } from "../PostDisplay";

interface Props {
  post: Post;
  /** モーダル等のサブビュー内表示。プレイリスト登録・チェックボックスを無効化 */
  isSubView?: boolean;
  onQuoteClick?: (quoteText: string) => void;
  quoteReferencesMap?: QuoteReferencesMap;
  allPosts?: Post[];
  onJumpToPost?: (postSeq: number) => void;
  isArchived?: boolean;
}

export const PostItem: React.FunctionComponent<Props> = memo(function PostItem({
  post,
  isSubView,
  onQuoteClick,
  quoteReferencesMap,
  allPosts,
  onJumpToPost,
  isArchived = false,
}: Props) {
  const { isPostHidden, showNgContent } = useNgStore();
  const isNg = showNgContent && isPostHidden(post);
  const [expanded, setExpanded] = useState(false);

  if (post.status === "unavailable") {
    return (
      <div
        id={`post-${post.id}`}
        className="m-2 rounded border border-border bg-muted p-3 text-sm text-muted-foreground"
      >
        No.{post.seq} このレスは表示できません
      </div>
    );
  }

  if (isNg && !expanded) {
    return (
      // biome-ignore lint: <label>＆非表示<button>に乗り換え予定
      <div
        id={`post-${post.id}`}
        className="m-2 p-3 rounded bg-card border border-destructive/30 cursor-pointer hover:bg-card/80 transition-colors"
        onClick={(): void => setExpanded(true)}
      >
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-sm text-muted-foreground">
              No.{post.seq} のレスは非表示になっています
            </span>
            <span className="text-xs text-muted-foreground/70">
              クリックして内容を表示
            </span>
          </div>
          <MdExpandMore className="text-muted-foreground" size={20} />
        </div>
      </div>
    );
  }

  return (
    <div id={`post-${post.id}`} className="relative">
      {isNg && (
        // biome-ignore lint: <label>＆非表示<button>に乗り換え予定
        <div
          className="absolute top-2 right-2 z-10 flex items-center gap-1 px-2 py-1 bg-destructive/90 text-destructive-foreground rounded text-xs font-bold cursor-pointer hover:bg-destructive"
          onClick={(): void => setExpanded(false)}
        >
          <MdBlock size={14} />
          <span>NG</span>
        </div>
      )}
      <PostDisplay
        post={post}
        isSubView={isSubView}
        className={clsx("m-2 p-2 rounded bg-card", isNg && "opacity-70")}
        postNumberClassName="text-muted-foreground"
        onQuoteClick={onQuoteClick}
        quoteReferencesMap={quoteReferencesMap}
        allPosts={allPosts}
        onJumpToPost={onJumpToPost}
        isArchived={isArchived}
      />
    </div>
  );
});
