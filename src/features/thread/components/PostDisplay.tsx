import clsx from "clsx";
import { Fragment, useMemo, useState } from "react";
import { FiMessageCircle } from "react-icons/fi";
import { HiOutlineDotsVertical } from "react-icons/hi";
import type { Post } from "@/entities/post";
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
  onJumpToPost?: () => void;
}

export const PostDisplay: React.FunctionComponent<Props> = ({
  post,
  isSubView,
  className,
  onQuoteClick,
  quoteReferencesMap,
  allPosts,
  onJumpToPost,
}: Props) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [quoteSourcesOpen, setQuoteSourcesOpen] = useState(false);
  const [displayIdMenuOpen, setDisplayIdMenuOpen] = useState(false);
  const { mutate: soudane, isPending } = useSoudaneMutation();

  // このレスを引用している元レスのインデックス一覧
  const quoteSourceIndexes: number[] = quoteReferencesMap?.get(post.id) || [];

  // 1レス目のdisplay_idを取得
  const opDisplayId: string | null = allPosts?.[0]?.display_id || null;

  // スレ1レス目の本文に「レインボー」が含まれるかで虹色モード判定。
  // body 全行の String.includes 走査が menuOpen 等の頻繁な再レンダで
  // 都度走るのを避けるため allPosts 依存でメモ化。
  const isRainbow = useMemo<boolean>(
    () =>
      allPosts?.[0]?.body.some((line) => line.text.includes("レインボー")) ??
      false,
    [allPosts],
  );

  // 現在のdisplay_idが1レス目と同じかチェック
  const isOpId =
    post.display_id && opDisplayId && post.display_id === opDisplayId;

  // サムネイル表示用（一覧・投稿表示用）。
  // is_animated な画像 (GIF / APNG / Animated WebP 等) はサムネに置き換えず
  // フルサイズで表示する。判定は attachment.is_animated を信頼する。
  const thumbnailUrl = post.attachment
    ? getImageUrl(post.attachment, post.attachment.is_animated)
    : null;
  // フルサイズ表示用（別タブで開く用）
  const fullImageUrl = post.attachment
    ? resolveUploadPath(post.attachment.path)
    : null;
  const isVideo = post.attachment ? isVideoAttachment(post.attachment) : false;

  // OGP表示用のリンクリスト（引用行のリンクは対象外）
  const links = useMemo<string[]>(
    () =>
      post.body
        .filter((line) => line.type !== "quote")
        .flatMap((line) => segmentize(line.text))
        .filter((seg): seg is LinkSegment => seg.type === "link")
        .map((seg) => seg.href),
    [post.body],
  );

  // 表示専用の装飾済 body。再レンダ毎に isMay10JST() を再評価するため、
  // 0 時跨ぎでも次レンダで反映される（spec: メモ化しない方針）。
  // 5/10 以外は body と同じ参照を返すので React 差分コストは無し。
  // ただし以下の条件を満たすスレでは装飾をスキップ:
  //   - OP 本文に "twitch" を含む
  //   - OP の ACT (email) に "やめな"/"止めな"/"辞めな" を含む
  const opPost = allPosts?.[0];
  const skipDecorate =
    (opPost?.body.some((line) => line.text.includes("twitch")) ?? false) ||
    (opPost
      ? ["やめな", "止めな", "辞めな"].some((kw) => opPost.email.includes(kw))
      : false);
  const decoratedBody = skipDecorate ? post.body : decoratePostBody(post.body);

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

  const threadId = post.thread_id;
  const postNumber = post.id;

  return (
    <article className={className}>
      <header className="flex items-center justify-between gap-2 -mt-1.5 -mb-0.5 text-xs text-muted-foreground">
        <div className="flex items-center flex-wrap gap-2">
          <span className="reply-number-in-thread">
            {post.number_in_thread - 1}
          </span>
          {post.name ? (
            <span className="reply-name px-1.5 py-0.5 bg-accent-400/30 text-accent rounded font-bold text-xs">
              {post.name}
            </span>
          ) : (
            " "
          )}
          <span data-timestamp={post.created_at}>
            {formatDate(post.created_at)}
          </span>
          {post.display_id && (
            <label
              className={clsx(
                "display-id hover:underline cursor-pointer",
                isOpId ? "text-accent" : "text-destructive",
              )}
            >
              <button
                type="button"
                onClick={(): void => setDisplayIdMenuOpen(true)}
              />
              ID:{post.display_id}
            </label>
          )}
          <label
            className={clsx(
              "post-no underline hover:text-foreground cursor-pointer",
              post.attachment?.is_oekaki && "text-otegaki",
            )}
          >
            <button type="button" onClick={(): void => setMenuOpen(true)} />
            No.{post.id}
          </label>
          <SoudaneButton
            count={post.soudane_count}
            onClick={(): void => soudane(post.id)}
            disabled={isPending}
          />
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
          {post.attachment?.path && fullImageUrl && (
            <figcaption>
              {isVideo ? "動画ファイル名:" : "画像ファイル名:"}
              <a
                href={fullImageUrl || thumbnailUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mx-1 text-primary hover:text-primary/80 underline"
              >
                {post.attachment.path.replace(/^uploads\//, "")}
              </a>
              -({post.attachment.size}B)
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
              />
            </a>
          )}
          {post.attachment?.path && fullImageUrl && (
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
        {post.email && <p className="text-act font-bold">{post.email}</p>}
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
        />
      )}

      {/* Display IDメニュー */}
      {post.display_id && (
        <DisplayIdMenu
          isOpen={displayIdMenuOpen}
          onClose={(): void => setDisplayIdMenuOpen(false)}
          displayId={post.display_id}
          threadId={threadId}
          allPosts={allPosts}
          quoteReferencesMap={quoteReferencesMap}
          onQuoteClick={onQuoteClick}
        />
      )}
    </article>
  );
};
