import clsx from "clsx";
import { memo, useState } from "react";
import { MdBlock, MdExpandMore } from "react-icons/md";
import type { Post } from "@/entities/post";
import { useNgStore } from "@/features/ng-filter/stores";
import { PostDisplay } from "@/features/thread/components/PostDisplay";
import type { QuoteReferencesMap } from "@/features/thread/utils/extractQuoteReferences";
import { useAimogeBeforeRender, useAimogeRendered } from "@/shared/lib/aimoge";

interface Props {
  post: Post;
  /** モーダル等のサブビュー内表示。プレイリスト登録・チェックボックスを無効化 */
  isSubView?: boolean;
  onQuoteClick?: (quoteText: string) => void;
  quoteReferencesMap?: QuoteReferencesMap;
  allPosts?: Post[];
  onJumpToPost?: (postSeq: number) => void;
  isArchived?: boolean;
  postContentVersion?: number;
  postAlreadyPrepared?: boolean;
}

export const PostItem: React.FunctionComponent<Props> = memo(function PostItem({
  post,
  isSubView,
  onQuoteClick,
  quoteReferencesMap,
  allPosts,
  onJumpToPost,
  isArchived = false,
  postAlreadyPrepared = false,
}: Props) {
  const renderedPost = useAimogeBeforeRender(
    "post:beforeRender",
    post,
    postAlreadyPrepared,
  );
  const elementRef = useAimogeRendered("post", renderedPost, post.threadId);
  const { isPostHidden, showNgContent } = useNgStore();
  const isNg = renderedPost
    ? showNgContent && isPostHidden(renderedPost)
    : false;
  const [expanded, setExpanded] = useState(false);

  if (!renderedPost) return null;
  if (renderedPost.status !== "public") return null;

  if (isNg && !expanded) {
    return (
      // biome-ignore lint: <label>＆非表示<button>に乗り換え予定
      <div
        ref={elementRef}
        id={`post-${renderedPost.id}`}
        className="m-2 p-3 rounded bg-card border border-destructive/30 cursor-pointer hover:bg-card/80 transition-colors"
        onClick={(): void => setExpanded(true)}
      >
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-sm text-muted-foreground">
              No.{renderedPost.seq} のレスは非表示になっています
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
    <div ref={elementRef} id={`post-${renderedPost.id}`} className="relative">
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
        post={renderedPost}
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
}, arePostItemPropsEqual);

function arePostItemPropsEqual(previous: Props, next: Props): boolean {
  if (
    previous.post !== next.post ||
    previous.isSubView !== next.isSubView ||
    previous.onQuoteClick !== next.onQuoteClick ||
    previous.onJumpToPost !== next.onJumpToPost ||
    previous.isArchived !== next.isArchived ||
    previous.postContentVersion !== next.postContentVersion ||
    previous.postAlreadyPrepared !== next.postAlreadyPrepared
  ) {
    return false;
  }
  if (previous.postContentVersion !== undefined) return true;
  return (
    previous.quoteReferencesMap === next.quoteReferencesMap &&
    previous.allPosts === next.allPosts
  );
}
