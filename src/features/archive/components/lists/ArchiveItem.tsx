import { Link } from "@tanstack/react-router";
import { memo } from "react";
import noImage from "@/assets/img/no-image.svg";
import { getThreadTitle, resolveUploadPath } from "@/entities/thread";
import type { ArchiveThread } from "@/features/archive/types";

interface ArchiveItemProps {
  thread: ArchiveThread;
}

export const ArchiveItem: React.FunctionComponent<ArchiveItemProps> = memo(
  function ArchiveItem({ thread }: ArchiveItemProps) {
    const title = getThreadTitle(thread);
    // 既存のgetImageUrlと同様、空文字のサムネイルも本画像へフォールバックする
    const imageUrl = resolveUploadPath(thread.thumb || thread.image || "");

    return (
      <div className="group relative bg-card/50 rounded-lg overflow-hidden hover:bg-card transition-colors">
        <Link
          to="/thread/$threadId"
          params={{ threadId: String(thread.id) }}
          className="block focus:outline-none focus:ring-2 focus:ring-primary focus:ring-inset"
        >
          <div className="relative aspect-square bg-muted flex items-center justify-center">
            <img
              src={imageUrl}
              alt={title}
              loading="lazy"
              className="w-full h-full object-contain"
              onError={(e: React.SyntheticEvent<HTMLImageElement>): void => {
                (e.target as HTMLImageElement).src = noImage;
              }}
            />
            {thread.is_permanent && (
              <span className="absolute top-1 left-1 px-1.5 py-0.5 text-xs font-bold bg-primary text-primary-foreground rounded">
                永久
              </span>
            )}
            <span className="absolute bottom-1 right-1 px-1.5 py-0.5 text-xs font-bold bg-black/70 text-white rounded">
              {thread.reply_count}レス
            </span>
          </div>
          <div className="flex flex-col gap-1 p-2">
            <div className="min-w-0 text-xs text-muted-foreground line-clamp-2 leading-tight group-hover:text-foreground transition-colors">
              {title}
            </div>
            <time
              dateTime={thread.archived_at}
              className="text-2xs text-muted-foreground truncate"
            >
              保存 {thread.archived_at}
            </time>
          </div>
        </Link>
      </div>
    );
  },
);
