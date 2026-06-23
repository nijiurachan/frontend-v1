// src/features/jukebox/ui/QueueList.tsx
import type { JukeboxQueueItem } from "@nijiurachan/js/pure/jukebox";
import { FiSlash, FiTrash2 } from "react-icons/fi";
import { cn } from "@/shared/lib/cn";

/** YouTube の mediaId から watch URL を組み立てる（href 用に encode）。
 *  YouTube 以外は対応しないため、リンクは youtube のときだけ描画する。 */
function youtubeWatchUrl(mediaId: string): string {
  return `https://youtu.be/${encodeURIComponent(mediaId)}`;
}

interface QueueListProps {
  queue: JukeboxQueueItem[];
  onCancelMine: () => void;
  isCancelling: boolean;
  /** 指定トラックの除外投票をトグルする（誰でも押せる） */
  onVote: (trackId: number) => void;
  /** 投票ミューテーション実行中か（全項目で共有） */
  isVoting: boolean;
}

export const QueueList: React.FunctionComponent<QueueListProps> = ({
  queue,
  onCancelMine,
  isCancelling,
  onVote,
  isVoting,
}: QueueListProps) => {
  if (queue.length === 0) {
    return (
      <p className="text-sm text-muted-foreground px-4 py-2">キューは空です</p>
    );
  }

  return (
    <ol className="flex flex-col divide-y divide-border max-h-[50vh] overflow-y-auto overscroll-contain">
      {queue.map((item, idx) => (
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
              <span className="text-xs text-muted-foreground">あなたの曲</span>
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
              onClick={onCancelMine}
              disabled={isCancelling}
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
      ))}
    </ol>
  );
};
