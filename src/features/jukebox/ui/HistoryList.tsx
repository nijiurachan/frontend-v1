// src/features/jukebox/ui/HistoryList.tsx
import type { JukeboxHistoryItem } from "@/features/jukebox/api/jukeboxClient";

/** YouTube の mediaId から watch URL（href 用に encode）。youtube 以外はリンクを出さない。 */
function youtubeWatchUrl(mediaId: string): string {
  return `https://youtu.be/${encodeURIComponent(mediaId)}`;
}

interface HistoryListProps {
  history: JukeboxHistoryItem[];
  isLoading: boolean;
  error: Error | null;
}

/** 直近24hの再生履歴リスト（新しい順）。曲名の下に元動画 URL リンク。 */
export const HistoryList: React.FunctionComponent<HistoryListProps> = ({
  history,
  isLoading,
  error,
}: HistoryListProps) => {
  if (isLoading) {
    return (
      <p className="text-xs text-muted-foreground px-4 py-2">読み込み中…</p>
    );
  }
  if (error) {
    return (
      <p className="text-xs text-destructive px-4 py-2" role="alert">
        履歴の取得に失敗しました
      </p>
    );
  }
  if (history.length === 0) {
    return (
      <p className="text-xs text-muted-foreground px-4 py-2">
        まだ履歴がありません
      </p>
    );
  }
  // サーバー順に依存せず UI 側で新しい順を担保する（24h 分なので十分軽量）
  const sorted = [...history].sort((a, b) => b.endedAtMs - a.endedAtMs);
  return (
    <ol className="flex flex-col divide-y divide-border max-h-[40vh] overflow-y-auto overscroll-contain">
      {sorted.map((item, idx) => (
        <li
          key={`${item.id}-${item.mediaId}`}
          className="flex items-center gap-2 px-4 py-2"
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
          </div>
        </li>
      ))}
    </ol>
  );
};
