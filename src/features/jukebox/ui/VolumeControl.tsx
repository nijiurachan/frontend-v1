// src/features/jukebox/ui/VolumeControl.tsx
//
// ジュークボックスの音量スライダー。表示は 0-100、ストアは 0-1 で保持する。
// 共有 MiniPlayer の primary スロット音量を操作し、YouTubeEmbed 側の購読が
// 実プレイヤーへ反映する（初期値は 0.5 = 真ん中）。
import { FiVolume1, FiVolume2, FiVolumeX } from "react-icons/fi";
import { usePlayerStore } from "@/features/player/stores/playerStore";

export const VolumeControl: React.FunctionComponent = () => {
  const volume = usePlayerStore((s) => s.players.primary.volume);
  const setVolume = usePlayerStore((s) => s.setVolume);
  const pct = Math.round(volume * 100);

  const Icon = pct === 0 ? FiVolumeX : pct < 50 ? FiVolume1 : FiVolume2;

  return (
    <div className="flex items-center gap-2 px-4 py-2">
      <Icon
        aria-hidden="true"
        size={18}
        className="shrink-0 text-muted-foreground"
      />
      <input
        type="range"
        min={0}
        max={100}
        step={1}
        value={pct}
        aria-label="音量"
        onChange={(e): void =>
          setVolume("primary", Number(e.target.value) / 100)
        }
        className="h-1 flex-1 cursor-pointer accent-primary"
      />
      <span className="w-9 shrink-0 text-right text-xs tabular-nums text-muted-foreground">
        {pct}
      </span>
    </div>
  );
};
