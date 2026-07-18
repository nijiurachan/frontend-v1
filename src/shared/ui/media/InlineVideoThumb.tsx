/**
 * InlineVideoThumb — サムネタップでインライン再生する動画サムネ要素
 *
 * # 仕様
 * - 基本的にサムネイル画像 ＋ VideoPlayOverlay（再生アイコン）を表示する。
 * - タップすると <video>（自動再生）へ差し替わる。動画への初回タップで
 *   コントロールが出る（短尺動画でオーバーレイが目障りにならないように）。
 * - スレッド（ページ）内で同時に1個しか video 化しない。別のサムネをタップ
 *   すると前の動画はサムネへ戻る。
 * - 再生中のままページ遷移などで消えると自動で解除されるので、外側にリセット
 *   処理は不要。一覧が再生成されると識別子（useId）も更新され、遷移して戻った
 *   際の誤自動再生も起きない。
 *
 * # 設置方法
 * 動画URL・サムネ画像URL・表示サイズを渡すだけ。識別子（post.id 等）は内部の
 * useId で自動採番するため不要。
 *
 * ```tsx
 * import { InlineVideoThumb } from "@/shared/ui/media";
 *
 * <InlineVideoThumb
 *   src={動画URL}
 *   thumbnailSrc={サムネ画像URL}
 *   width={表示幅}
 *   height={表示高さ}
 * />
 * ```
 *
 * 依存: 同フォルダの VideoPlayOverlay（react-icons）と Tailwind クラス。
 * 他サイトへ移す場合はこの2点も併せて持っていくこと。
 */
import { useEffect, useId, useState, useSyncExternalStore } from "react";
import { cn } from "@/shared/lib/cn";
import { VideoPlayOverlay } from "@/shared/ui/media/VideoPlayOverlay";

// 「同時に1つだけ再生」の協調用。外部状態ライブラリに依存しないよう
// モジュールスコープのシングルトンを useSyncExternalStore で購読する。
let playingId: string | null = null;
const listeners: Set<() => void> = new Set();

function subscribe(cb: () => void): () => void {
  listeners.add(cb);
  return (): void => {
    listeners.delete(cb);
  };
}

function getSnapshot(): string | null {
  return playingId;
}

function setPlaying(id: string | null): void {
  if (playingId === id) return;
  playingId = id;
  for (const l of listeners) l();
}

interface InlineVideoThumbProps {
  /** 動画URL */
  src: string;
  /** サムネイル画像URL */
  thumbnailSrc: string;
  width: number;
  height: number;
  alt?: string;
  /** 外側要素のクラスを拡張する場合に指定 */
  className?: string;
}

/** 本体。仕様・使い方はファイル冒頭の説明を参照。 */
export const InlineVideoThumb: React.FunctionComponent<
  InlineVideoThumbProps
> = ({
  src,
  thumbnailSrc,
  width,
  height,
  alt = "",
  className,
}: InlineVideoThumbProps) => {
  const id = useId();
  const playing = useSyncExternalStore(subscribe, getSnapshot) === id;

  // 自分が再生中のまま消えるとき（=ページ遷移等）だけ解除する。
  useEffect(
    () => (): void => {
      if (getSnapshot() === id) setPlaying(null);
    },
    [id],
  );

  if (playing) {
    return <Player src={src} width={width} height={height} />;
  }

  return (
    <button
      type="button"
      onClick={(): void => setPlaying(id)}
      className={cn("relative inline-block", className)}
      aria-label="動画を再生"
    >
      <img
        src={thumbnailSrc}
        alt={alt}
        className="max-w-full rounded-lg"
        width={width}
        height={height}
        loading="lazy"
        decoding="async"
      />
      <VideoPlayOverlay />
    </button>
  );
};

interface PlayerProps {
  src: string;
  width: number;
  height: number;
}

/**
 * 再生中の <video>。短尺動画ではコントロールのオーバーレイが目障りなため、
 * 初期は controls なしで自動再生し、動画への初回タップで controls を表示する。
 * 再生対象が切り替わる度に新規マウントされるので showControls は自然にリセットされる。
 */
const Player: React.FunctionComponent<PlayerProps> = ({
  src,
  width,
  height,
}: PlayerProps) => {
  const [showControls, setShowControls] = useState(false);

  return (
    <video
      src={src}
      className="max-w-full rounded-lg"
      width={width}
      height={height}
      controls={showControls}
      autoPlay
      preload="none"
      playsInline
      onClick={(): void => setShowControls(true)}
    >
      <track kind="captions" />
    </video>
  );
};
