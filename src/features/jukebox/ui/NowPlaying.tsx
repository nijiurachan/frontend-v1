// src/features/jukebox/ui/NowPlaying.tsx
import type { JukeboxNowPlaying } from "@nijiurachan/js/pure/jukebox";
import { FiMusic } from "react-icons/fi";
import { cn } from "@/shared/lib/cn";

interface NowPlayingProps {
  nowPlaying: JukeboxNowPlaying | null;
  /** 現在の再生位置（秒）。playerStore から親が渡す */
  currentTimeSec: number;
}

function formatSec(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export const NowPlaying: React.FunctionComponent<NowPlayingProps> = ({
  nowPlaying,
  currentTimeSec,
}: NowPlayingProps) => {
  if (!nowPlaying) {
    return (
      <div
        className={cn(
          "flex items-center gap-2 p-4 rounded-lg",
          "bg-card text-muted-foreground",
        )}
      >
        <FiMusic aria-hidden="true" size={18} />
        <span className="text-sm">再生中の曲はありません</span>
      </div>
    );
  }

  const progress =
    nowPlaying.durationSec > 0
      ? Math.min(1, currentTimeSec / nowPlaying.durationSec)
      : 0;

  return (
    <div className="flex flex-col gap-2 p-4 rounded-lg bg-card">
      <div className="flex items-start gap-2">
        <FiMusic
          aria-hidden="true"
          size={18}
          className="mt-0.5 text-primary shrink-0"
        />
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-foreground truncate">
              {nowPlaying.title ?? nowPlaying.mediaId}
            </span>
            {nowPlaying.isReplay && (
              <span
                className="text-xs text-muted-foreground border border-border rounded px-1 py-0.5 shrink-0"
                aria-label="ラジオ自動再生"
              >
                ♻️ ラジオ（自動再生）
              </span>
            )}
          </div>
          <span className="text-xs text-muted-foreground">
            {nowPlaying.source === "youtube" ? "YouTube" : "SoundCloud"}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span>{formatSec(currentTimeSec)}</span>
        <div className="flex-1 h-1 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-500"
            style={{ width: `${(progress * 100).toFixed(1)}%` }}
          />
        </div>
        <span>{formatSec(nowPlaying.durationSec)}</span>
      </div>
    </div>
  );
};
