import clsx from "clsx";
import { Fragment, memo, useMemo, useState } from "react";
import { FiMessageCircle } from "react-icons/fi";
import { HiOutlineDotsVertical } from "react-icons/hi";
import { getPostBodyLines, type Post } from "@/entities/post";
import { getImageUrl, resolveUploadPath } from "@/entities/thread";
import { PlayerTrigger } from "@/features/player/components";
import { DisplayIdMenu, PostActionMenu } from "@/features/thread/ui";
import {
  decoratePostBody,
  formatDate,
  isVideoAttachment,
  type LinkSegment,
  segmentize,
} from "@/shared/lib";
import { InlineVideoThumb } from "@/shared/ui/media";
import { useSoudaneMutation } from "../hooks/useSoudaneMutation";
import type { QuoteReferencesMap } from "../utils/extractQuoteReferences";
import { SoudaneButton } from "./actions/SoudaneButton";
import { LineDisplay } from "./LineDisplay";
import { QuoteSourcesModal } from "./modals/QuoteSourcesModal";
import { OgpCardList } from "./OgpCardList";

interface Props {
  post: Post;
  /** モーダル等のサブビュー内表示。プレイリスト登録・チェックボックスを無効化 */
  isSubView?: boolean;
  className?: string;
  postNumberClassName?: string;
  onQuoteClick?: (quoteText: string) => void;
  quoteReferencesMap?: QuoteReferencesMap;
  allPosts?: Post[];
  onJumpToPost?: (postSeq: number) => void;
  isArchived?: boolean;
}

export const PostDisplay: React.FunctionComponent<Props> = memo(
  function PostDisplay({
    post,
    isSubView,
    className,
    onQuoteClick,
    quoteReferencesMap,
    allPosts,
    onJumpToPost,
    isArchived = false,
  }: Props) {
    const [menuOpen, setMenuOpen] = useState(false);
    const [quoteSourcesOpen, setQuoteSourcesOpen] = useState(false);
    const [displayIdMenuOpen, setDisplayIdMenuOpen] = useState(false);
    const { mutate: soudane, isPending } = useSoudaneMutation();
    const bodyLines = useMemo(() => getPostBodyLines(post.body), [post.body]);

    // このレスを引用している元レスのインデックス一覧
    const quoteSourceIndexes: number[] = quoteReferencesMap?.get(post.id) || [];

    // 1レス目のdisplayIdを取得
    const opDisplayId: string | null = allPosts?.[0]?.displayId || null;

    // スレ1レス目の本文に「レインボー」が含まれるかで虹色モード判定。
    // body 全行の String.includes 走査が menuOpen 等の頻繁な再レンダで
    // 都度走るのを避けるため allPosts 依存でメモ化。
    const isRainbow = useMemo<boolean>(
      () => allPosts?.[0]?.body.includes("レインボー") ?? false,
      [allPosts],
    );

    // 現在のdisplayIdが1レス目と同じかチェック
    const isOpId =
      post.displayId && opDisplayId && post.displayId === opDisplayId;

    // サムネイル表示用（一覧・投稿表示用）。
    // is_animated な画像 (GIF / APNG / Animated WebP 等) はサムネに置き換えず
    // フルサイズで表示する。判定は attachment.is_animated を信頼する。
    const thumbnailUrl = post.attachment
      ? getImageUrl(post.attachment, post.attachment.kind === "animated")
      : null;
    // フルサイズ表示用（別タブで開く用）
    const fullImageUrl = post.attachment
      ? resolveUploadPath(post.attachment.originalUrl)
      : null;
    const isVideo = post.attachment
      ? isVideoAttachment(post.attachment)
      : false;

    // OGP表示用のリンクリスト（引用行のリンクは対象外）
    const links = useMemo<string[]>(
      () =>
        bodyLines
          .filter((line) => line.type !== "quote")
          .flatMap((line) => segmentize(line.text))
          .filter((seg): seg is LinkSegment => seg.type === "link")
          .map((seg) => seg.href),
      [bodyLines],
    );

    // 表示専用の装飾済 body。再レンダ毎に isMay10JST() を再評価するため、
    // 0 時跨ぎでも次レンダで反映される（spec: メモ化しない方針）。
    // 5/10 以外は body と同じ参照を返すので React 差分コストは無し。
    // ただし以下の条件を満たすスレでは装飾をスキップ:
    //   - OP 本文に "twitch" を含む
    //   - OP の ACT (email) に "やめな"/"止めな"/"辞めな" を含む
    const opPost = allPosts?.[0];
    const skipDecorate = opPost?.body.includes("twitch") ?? false;
    const decoratedBody = skipDecorate
      ? bodyLines
      : decoratePostBody(bodyLines);

    // オリジナルサイズからサムネ/表示サイズを計算
    const ow = post.attachment?.width;
    const oh = post.attachment?.height;
    const maxSize = isVideo ? 400 : 250;
    let thumbWidth = maxSize;
    let thumbHeight = maxSize;
    if (ow && oh) {
      const scale = Math.min(maxSize / ow, maxSize / oh, 1);
      thumbWidth = Math.round(ow * scale);
      thumbHeight = Math.round(oh * scale);
    }

    const threadId = post.threadId;
    const postNumber = post.seq;

    return (
      <article className={className}>
        <header className="flex items-center justify-between gap-2 -mt-1.5 -mb-0.5 text-xs text-muted-foreground">
          <div className="flex items-center flex-wrap gap-2">
            <span className="reply-number-in-thread">{post.seq}</span>
            <span data-timestamp={post.createdAt}>
              {formatDate(post.createdAt)}
            </span>
            {post.displayId && (
              <button
                type="button"
                onClick={(): void => setDisplayIdMenuOpen(true)}
                className={clsx(
                  "display-id hover:underline cursor-pointer",
                  isOpId ? "text-accent" : "text-destructive",
                )}
              >
                ID:{post.displayId}
              </button>
            )}
            <button
              type="button"
              onClick={(): void => setMenuOpen(true)}
              className={clsx(
                "post-no underline hover:text-foreground cursor-pointer",
                post.attachment?.kind === "animated" && "text-otegaki",
              )}
            >
              No.{post.seq}
            </button>
            {!isArchived && (
              <SoudaneButton
                count={post.sodaneCount}
                onClick={(): void => soudane(post.id)}
                disabled={isPending}
              />
            )}
            {isArchived && post.delCount != null && (
              <span className="px-2 py-1 text-muted-foreground">
                delx{post.delCount}
              </span>
            )}
            {quoteSourceIndexes.length > 0 && (
              <button
                type="button"
                onClick={(): void => setQuoteSourcesOpen(true)}
                className="flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-muted text-primary transition-colors"
                aria-label={`${quoteSourceIndexes.length}件の引用元を表示`}
              >
                <FiMessageCircle className="w-3.5 h-3.5" />
                <span className="text-xs font-medium">
                  {quoteSourceIndexes.length}
                </span>
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={(): void => setMenuOpen(true)}
            className="p-1.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            aria-label="メニュー"
          >
            <HiOutlineDotsVertical className="w-5 h-5" />
          </button>
        </header>

        {thumbnailUrl && (
          <figure className="ml-2 mb-2 text-xs text-muted-foreground">
            {post.attachment?.originalUrl && fullImageUrl && (
              <figcaption>
                {isVideo ? "動画ファイル名:" : "画像ファイル名:"}
                <a
                  href={fullImageUrl || thumbnailUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mx-1 text-primary hover:text-primary/80 underline"
                >
                  {fullImageUrl.split("/").pop() ?? "添付ファイル"}
                </a>
                <a
                  href={`${fullImageUrl}?original=1`}
                  download
                  className="ml-1 text-primary hover:text-primary/80 underline"
                >
                  [保存]
                </a>
              </figcaption>
            )}
            {isVideo && fullImageUrl ? (
              <InlineVideoThumb
                src={fullImageUrl}
                thumbnailSrc={thumbnailUrl}
                width={thumbWidth}
                height={thumbHeight}
              />
            ) : (
              <a
                href={fullImageUrl || thumbnailUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="relative inline-block"
              >
                <img
                  src={thumbnailUrl}
                  alt="添付画像"
                  className="max-w-full rounded-lg"
                  width={thumbWidth}
                  height={thumbHeight}
                  loading="lazy"
                  decoding="async"
                />
              </a>
            )}
            {post.attachment?.originalUrl && fullImageUrl && (
              <div className="mt-1">
                {isVideo && (
                  <PlayerTrigger
                    url={fullImageUrl}
                    threadId={threadId}
                    postNo={postNumber}
                    isSubView={isSubView}
                  />
                )}
              </div>
            )}
          </figure>
        )}

        {/* 本文表示 */}
        <blockquote className="ml-2 text-foreground leading-relaxed">
          {decoratedBody.map((line, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: decoratedBody は同 post 内で順序・件数が固定のため index は安定キー
            <Fragment key={i}>
              {i > 0 && <br />}
              <LineDisplay
                line={line}
                onQuoteClick={onQuoteClick}
                threadId={threadId}
                postNumber={postNumber}
                isSubView={isSubView}
                isRainbow={isRainbow}
                allPosts={allPosts}
                onJumpToPost={onJumpToPost}
              />
            </Fragment>
          ))}
        </blockquote>

        {/* OGPカード表示 */}
        {links.length > 0 && <OgpCardList urls={links} />}

        <PostActionMenu
          isOpen={menuOpen}
          onClose={(): void => setMenuOpen(false)}
          post={post}
          onJumpToPost={onJumpToPost}
          isArchived={isArchived}
          maxSeq={allPosts?.at(-1)?.seq ?? post.seq}
        />

        {/* 引用元一覧モーダル */}
        {allPosts && quoteSourceIndexes.length > 0 && (
          <QuoteSourcesModal
            isOpen={quoteSourcesOpen}
            onClose={(): void => setQuoteSourcesOpen(false)}
            sourceIndexes={quoteSourceIndexes}
            posts={allPosts}
            threadId={threadId}
            quoteReferencesMap={quoteReferencesMap}
            onQuoteClick={onQuoteClick}
            onJumpToPost={onJumpToPost}
            isArchived={isArchived}
          />
        )}

        {/* Display IDメニュー */}
        {post.displayId && (
          <DisplayIdMenu
            isOpen={displayIdMenuOpen}
            onClose={(): void => setDisplayIdMenuOpen(false)}
            displayId={post.displayId}
            threadId={threadId}
            allPosts={allPosts}
            quoteReferencesMap={quoteReferencesMap}
            onQuoteClick={onQuoteClick}
            isArchived={isArchived}
          />
        )}
      </article>
    );
  },
);
