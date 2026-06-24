// src/features/jukebox/ui/QueueList.tsx
import {
  computeQueueEtaMs,
  formatClockTime,
  type JukeboxNowPlaying,
  type JukeboxQueueItem,
} from "@nijiurachan/js/pure/jukebox";
import { FiClock, FiSlash, FiTrash2 } from "react-icons/fi";
import { cn } from "@/shared/lib/cn";

/** YouTube の mediaId から watch URL を組み立てる（href 用に encode）。
 *  YouTube 以外は対応しないため、リンクは youtube のときだけ描画する。 */
function youtubeWatchUrl(mediaId: string): string {
  return `https://youtu.be/${encodeURIComponent(mediaId)}`;
}

interface QueueListProps {
  queue: JukeboxQueueItem[];
  /** 再生中トラック（再生目安時刻の起点に使う）。未再生なら null */
  nowPlaying: JukeboxNowPlaying | null;
  /** サーバー時刻(epoch ms)。再生目安時刻の基準にする */
  serverNowMs: number;
  /** 指定トラック(自分の曲)だけをキューから削除する */
  onCancelMine: (trackId: number) => void;
  /** 削除リクエスト飛行中のトラックID集合（その曲の削除ボタンのみ無効化。並行削除に対応） */
  cancellingIds: ReadonlySet<number>;
  /** 指定トラックの除外投票をトグルする（誰でも押せる） */
  onVote: (trackId: number) => void;
  /** 投票ミューテーション実行中か（全項目で共有） */
  isVoting: boolean;
}

export const QueueList: React.FunctionComponent<QueueListProps> = ({
  queue,
  nowPlaying,
  serverNowMs,
  onCancelMine,
  cancellingIds,
  onVote,
  isVoting,
}: QueueListProps) => {
  // 各曲の再生開始の目安時刻(epoch ms)。曲尺の積み上げによる推定。
  const queueEtas = computeQueueEtaMs(nowPlaying, queue, serverNowMs);

  if (queue.length === 0) {
    return (
      <p className="text-sm text-muted-foreground px-4 py-2">キューは空です</p>
    );
  }

  return (
    <ol className="flex flex-col divide-y divide-border max-h-[50vh] overflow-y-auto overscroll-contain">
      {queue.map((item, idx) => {
        const etaMs = queueEtas[idx];
        return (
          <li
            key={`${item.id}-${item.mediaId}`}
            className={cn(
              "flex items-center gap-2 px-4 py-3",
              item.mine && "bg-primary/5",
            )}
          >
            <span className="text-xs text-muted-foreground w-5 text-right shrink-0">
              {idx + 1}
            </span>
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-sm text-foreground truncate">
                {item.title ?? item.mediaId}
              </span>
              {etaMs != null && (
                <span className="flex items-center gap-1 text-xs text-muted-foreground tabular-nums">
                  <FiClock aria-hidden="true" size={11} className="shrink-0" />
                  <span>{formatClockTime(etaMs)}頃に再生</span>
                </span>
              )}
              {item.source === "youtube" && (
                <a
                  href={youtubeWatchUrl(item.mediaId)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary truncate hover:underline"
                >
                  {youtubeWatchUrl(item.mediaId)}
                </a>
              )}
              {item.mine && (
                <span className="text-xs text-muted-foreground">
                  あなたの曲
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={(): void => {
                onVote(item.id);
              }}
              disabled={isVoting}
              className={cn(
                // border 常時付与・状態で色だけ切替（トグル時のレイアウトシフト防止）
                "shrink-0 flex items-center gap-1 rounded border px-2 py-1 text-xs font-medium",
                item.myVoted
                  ? "border-destructive bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  : "border-border text-foreground hover:bg-muted",
                "disabled:opacity-40",
              )}
              aria-pressed={item.myVoted}
              aria-label={item.myVoted ? "除外投票を取り消す" : "除外投票"}
            >
              <FiSlash aria-hidden="true" size={14} />
              {item.myVoted ? "投票済み" : "除外投票"}
            </button>
            {item.mine && (
              <button
                type="button"
                onClick={(): void => {
                  onCancelMine(item.id);
                }}
                disabled={cancellingIds.has(item.id)}
                className={cn(
                  "shrink-0 p-1 rounded text-destructive",
                  "hover:bg-destructive/10 disabled:opacity-40",
                )}
                aria-label="キューから削除"
              >
                <FiTrash2 aria-hidden="true" size={16} />
              </button>
            )}
          </li>
        );
      })}
    </ol>
  );
};
