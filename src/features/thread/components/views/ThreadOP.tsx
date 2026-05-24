import clsx from "clsx";
import { useState } from "react";
import { GiSpiralBloom } from "react-icons/gi";
import { MdBlock, MdExpandMore } from "react-icons/md";
import type { Post } from "@/entities/post";
import { useNgStore } from "@/features/ng-filter/stores";
import { useSettingsStore } from "@/features/settings/hooks";
import type { QuoteReferencesMap } from "../../utils";
import { PostDisplay } from "../PostDisplay";

interface Props {
  post: Post;
  onQuoteClick?: (quoteText: string) => void;
  quoteReferencesMap?: QuoteReferencesMap;
  allPosts?: Post[];
  onJumpToPost?: (postIndex: number) => void;
}

export const ThreadOP: React.FunctionComponent<Props> = ({
  post,
  onQuoteClick,
  quoteReferencesMap,
  allPosts,
  onJumpToPost,
}: Props) => {
  const { isPostHidden, showNgContent } = useNgStore();
  const isNg = isPostHidden(post);
  const spaceMode = useSettingsStore((s) => s.spaceMode);
  const showSpaceButton = spaceMode && !(isNg && !showNgContent);
  const [expanded, setExpanded] = useState(false);

  // NGかつshowNgContentがfalseの場合のみ非表示メッセージを表示
  if (isNg && !showNgContent) {
    return (
      <div
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
    const url = `${import.meta.env.BASE_PATH}/space/${post.thread_id}`;
    const win = window.open(url, "_blank");
    if (!win || win.closed) {
      window.location.href = url;
    }
  };

  return (
    <div id="post-0" className="relative">
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
        post={post}
        className={clsx("p-4", isNg && showNgContent && "opacity-70")}
        onQuoteClick={onQuoteClick}
        quoteReferencesMap={quoteReferencesMap}
        allPosts={allPosts}
        onJumpToPost={
          onJumpToPost ? (): void => onJumpToPost(post.id) : undefined
        }
        isSubView={false}
      />
    </div>
  );
};
