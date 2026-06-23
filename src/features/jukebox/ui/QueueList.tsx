// src/features/jukebox/ui/QueueList.tsx
import type { JukeboxQueueItem } from "@nijiurachan/js/pure/jukebox";
import { FiTrash2 } from "react-icons/fi";
import { cn } from "@/shared/lib/cn";

interface QueueListProps {
  queue: JukeboxQueueItem[];
  onCancelMine: () => void;
  isCancelling: boolean;
}

export const QueueList: React.FunctionComponent<QueueListProps> = ({
  queue,
  onCancelMine,
  isCancelling,
}: QueueListProps) => {
  if (queue.length === 0) {
    return (
      <p className="text-sm text-muted-foreground px-4 py-2">キューは空です</p>
    );
  }

  return (
    <ol className="flex flex-col divide-y divide-border">
      {queue.map((item, idx) => (
        <li
          key={`${item.mediaId}-${idx}`}
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
            <span className="text-xs text-muted-foreground">
              {item.source === "youtube" ? "YouTube" : "SoundCloud"}
              {item.mine && " · あなたの曲"}
            </span>
          </div>
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
