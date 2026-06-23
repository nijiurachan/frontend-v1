// src/features/jukebox/ui/VolumeControl.tsx
//
// ジュークボックスの音量スライダー。表示は 0-100、ストアは 0-1 で保持する。
// 共有 MiniPlayer の primary スロット音量を操作し、YouTubeEmbed 側の購読が
// 実プレイヤーへ反映する（初期値は 0.5 = 真ん中）。
import type { ChangeEvent } from "react";
import { FiVolume, FiVolume1, FiVolume2, FiVolumeX } from "react-icons/fi";
import { usePlayerStore } from "@/features/player/stores/playerStore";

export const VolumeControl: React.FunctionComponent = () => {
  const volume = usePlayerStore((s) => s.players.primary.volume);
  const setVolume = usePlayerStore((s) => s.setVolume);
  const muted = usePlayerStore((s) => s.players.primary.muted);
  const setMuted = usePlayerStore((s) => s.setMuted);
  const pct = Math.round(volume * 100);

  // × アイコンはミュート状態のみに連動させる（音量0でもミュートのフィードバックが出るように）。
  // 非ミュート時は音量で 無印 / 1波 / 2波 を切替。
  const Icon = muted
    ? FiVolumeX
    : pct === 0
      ? FiVolume
      : pct < 50
        ? FiVolume1
        : FiVolume2;

  return (
    <div className="flex items-center gap-2 px-4 py-2">
      <button
        type="button"
        onClick={(): void => setMuted("primary", !muted)}
        // aria-pressed で ON/OFF を伝えるため aria-label は固定にする
        aria-label="ミュート"
        aria-pressed={muted}
        // 見た目は 18px のままタップ領域を 44px 相当へ拡張（モバイル a11y）
        className="relative shrink-0 text-muted-foreground hover:text-foreground after:absolute after:-inset-[13px] after:content-['']"
      >
        <Icon aria-hidden="true" size={18} />
      </button>
      <input
        type="range"
        min={0}
        max={100}
        step={1}
        value={pct}
        aria-label="音量"
        onChange={(e: ChangeEvent<HTMLInputElement>): void =>
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
