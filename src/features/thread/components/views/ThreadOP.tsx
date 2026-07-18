import clsx from "clsx";
import { useState } from "react";
import { GiSpiralBloom } from "react-icons/gi";
import { MdBlock, MdExpandMore } from "react-icons/md";
import type { Post } from "@/entities/post";
import type { ThreadTag } from "@/entities/thread";
import { useNgStore } from "@/features/ng-filter/stores";
import { useSettingsStore } from "@/features/settings/hooks";
import { PostDisplay } from "@/features/thread/components/PostDisplay";
import type { QuoteReferencesMap } from "@/features/thread/utils";
import { useAimogeBeforeRender, useAimogeRendered } from "@/shared/lib/aimoge";
import { TagBadges } from "@/shared/ui/navigation";

interface Props {
  post: Post;
  tags: ThreadTag[];
  onQuoteClick?: (quoteText: string) => void;
  quoteReferencesMap?: QuoteReferencesMap;
  allPosts?: Post[];
  onJumpToPost?: (postIndex: number) => void;
  isArchived?: boolean;
}

export const ThreadOP: React.FunctionComponent<Props> = ({
  post,
  tags,
  onQuoteClick,
  quoteReferencesMap,
  allPosts,
  onJumpToPost,
  isArchived = false,
}: Props) => {
  const renderedPost = useAimogeBeforeRender("post:beforeRender", post);
  const elementRef = useAimogeRendered("post", renderedPost, post.threadId);
  const { isPostHidden, showNgContent } = useNgStore();
  const isNg = renderedPost ? isPostHidden(renderedPost) : false;
  const spaceMode = useSettingsStore((s) => s.spaceMode);
  const showSpaceButton = spaceMode && !(isNg && !showNgContent);
  const [expanded, setExpanded] = useState(false);

  if (!renderedPost) return null;
  if (renderedPost.status !== "public") return null;

  // NGかつshowNgContentがfalseの場合のみ非表示メッセージを表示
  if (isNg && !showNgContent) {
    return (
      <div
        ref={elementRef}
        id="post-0"
        className="p-8 text-center text-muted-foreground border-b border-border"
      >
        NGフィルターにより、このレスは非表示になっています
      </div>
    );
  }

  // NGかつshowNgContentがtrueで未展開の場合、折りたたみ表示
  if (isNg && showNgContent && !expanded) {
    return (
      // biome-ignore lint: <label>＆非表示<button>に乗り換え予定
      <div
        ref={elementRef}
        id="post-0"
        className="p-4 border-b border-border bg-card/50 cursor-pointer hover:bg-card/80 transition-colors"
        onClick={(): void => setExpanded(true)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 px-2 py-1 bg-destructive/90 text-destructive-foreground rounded text-xs font-bold">
              <MdBlock size={14} />
              <span>NG</span>
            </div>
            <div className="flex flex-col">
              <span className="text-sm text-muted-foreground">
                1レス目（スレッド本文）は非表示になっています
              </span>
              <span className="text-xs text-muted-foreground/70">
                クリックして内容を表示
              </span>
            </div>
          </div>
          <MdExpandMore className="text-muted-foreground" size={20} />
        </div>
      </div>
    );
  }

  const handleOpenSpaceMode = (e: React.MouseEvent): void => {
    e.stopPropagation();
    const url = `${import.meta.env.BASE_PATH}/space/${renderedPost.threadId}`;
    const win = window.open(url, "_blank");
    if (!win || win.closed) {
      window.location.href = url;
    }
  };

  return (
    <div ref={elementRef} id="post-0" className="relative">
      <div className="px-4 pt-4">
        <TagBadges tags={tags} />
      </div>
      {isNg && showNgContent && (
        // biome-ignore lint: <label>＆非表示<button>に乗り換え予定
        <div
          className="absolute top-4 right-4 z-10 flex items-center gap-1 px-2 py-1 bg-destructive/90 text-destructive-foreground rounded text-xs font-bold cursor-pointer hover:bg-destructive"
          onClick={(): void => setExpanded(false)}
        >
          <MdBlock size={14} />
          <span>NG</span>
        </div>
      )}
      {showSpaceButton && (
        <button
          type="button"
          onClick={handleOpenSpaceMode}
          aria-label="宇宙モードで見る"
          className={
            isNg && showNgContent
              ? "absolute top-4 right-16 z-10 p-1.5 rounded-full bg-background/60 text-primary hover:text-primary/80 hover:bg-background/80 transition"
              : "absolute top-4 right-4 z-10 p-1.5 rounded-full bg-background/60 text-primary hover:text-primary/80 hover:bg-background/80 transition"
          }
        >
          <GiSpiralBloom size={18} aria-hidden />
        </button>
      )}
      <PostDisplay
        post={renderedPost}
        className={clsx("p-4", isNg && showNgContent && "opacity-70")}
        onQuoteClick={onQuoteClick}
        quoteReferencesMap={quoteReferencesMap}
        allPosts={allPosts}
        onJumpToPost={onJumpToPost}
        isSubView={false}
        isArchived={isArchived}
      />
    </div>
  );
};
