// ============================================================
// MiniPlayerVideo.tsx
// 動画エリア: プロバイダーに応じた埋め込みコンポーネントに切り替え
// ============================================================

import { useEffect, useState } from "react";
import { NativeVideoEmbed } from "../adapters/NativeVideoEmbed";
import { NiconicoEmbed } from "../adapters/NiconicoEmbed";
import { TwitchEmbed } from "../adapters/TwitchEmbed";
import { YouTubeEmbed } from "../adapters/YouTubeEmbed";
import type { SlotId, Track } from "../stores/playerStore";
import { usePlayerStore } from "../stores/playerStore";
import { getSyncedNow } from "../utils/serverTime";

interface MiniPlayerVideoProps {
  currentTrack: Track | null;
  slotId: SlotId;
  /** 動画本体の幅（CSS幅値）。親が最小幅で広がっても動画はこの幅に保つ */
  videoWidth?: string;
  onFullControlChange?: (hasFullControl: boolean) => void;
}

export const MiniPlayerVideo: React.FunctionComponent<MiniPlayerVideoProps> = ({
  currentTrack,
  slotId,
  videoWidth,
  onFullControlChange,
}: MiniPlayerVideoProps) => {
  // 親（プレイヤ枠）がコントロール用に最小幅まで広がっても、動画本体は videoWidth に
  // 留める。flex の子にすると stretch で iframe 既定高さまで伸びて aspect-video が
  // 効かないため、ブロック + mx-auto で中央寄せし高さは aspect-video に追従させる。
  return (
    <div className="w-full bg-black">
      <div
        className="relative aspect-video bg-black mx-auto"
        style={{ width: videoWidth ?? "100%" }}
      >
        {!currentTrack ? (
          <div className="absolute inset-0 flex items-center justify-center text-white/30 text-sm">
            再生待機中
          </div>
        ) : (
          <>
            <EmbedDispatch
              key={currentTrack.provider}
              track={currentTrack}
              slotId={slotId}
              onFullControlChange={onFullControlChange}
            />
            <BeforeStartOverlay syncStartTime={currentTrack.syncStartTime} />
          </>
        )}
      </div>
    </div>
  );
};

// ----------------------------------------------------------
// 同時視聴 開始前オーバーレイ
// ----------------------------------------------------------

interface BeforeStartOverlayProps {
  syncStartTime?: number;
}

const BeforeStartOverlay: React.FunctionComponent<BeforeStartOverlayProps> = ({
  syncStartTime,
}: BeforeStartOverlayProps) => {
  const beforeStart = usePlayerStore((s) => s.beforeStart);
  const [remainingSec, setRemainingSec] = useState<number>(() =>
    syncStartTime != null
      ? Math.max(0, Math.ceil((syncStartTime - getSyncedNow()) / 1000))
      : 0,
  );

  useEffect(() => {
    if (!beforeStart || syncStartTime == null) return;
    const update = (): void => {
      setRemainingSec(
        Math.max(0, Math.ceil((syncStartTime - getSyncedNow()) / 1000)),
      );
    };
    update();
    const id = setInterval(update, 1000);
    return (): void => clearInterval(id);
  }, [beforeStart, syncStartTime]);

  if (!beforeStart || syncStartTime == null) return null;

  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/70 text-white pointer-events-none">
      <div className="text-center">
        <div className="text-xs opacity-80">上映まで</div>
        <div className="text-xl font-mono tabular-nums">
          {formatHms(remainingSec)}
        </div>
      </div>
    </div>
  );
};

function formatHms(totalSec: number): string {
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  const pad = (n: number): string => n.toString().padStart(2, "0");
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

// ----------------------------------------------------------
// プロバイダー別コンポーネント切り替え
// ----------------------------------------------------------

interface EmbedDispatchProps {
  track: Track;
  slotId: SlotId;
  onFullControlChange?: (hasFullControl: boolean) => void;
}

const EmbedDispatch: React.FunctionComponent<EmbedDispatchProps> = ({
  track,
  slotId,
  onFullControlChange,
}: EmbedDispatchProps) => {
  switch (track.provider) {
    case "youtube":
      return (
        <YouTubeEmbed
          providerId={track.providerId}
          slotId={slotId}
          onFullControlChange={onFullControlChange}
        />
      );
    case "nicovideo":
      return (
        <NiconicoEmbed
          providerId={track.providerId}
          slotId={slotId}
          onFullControlChange={onFullControlChange}
        />
      );
    case "twitch":
      return (
        <TwitchEmbed
          providerId={track.providerId}
          slotId={slotId}
          onFullControlChange={onFullControlChange}
        />
      );
    case "internal":
      return (
        <NativeVideoEmbed
          providerId={track.providerId}
          slotId={slotId}
          onFullControlChange={onFullControlChange}
        />
      );
    default:
      return (
        <div className="w-full h-full flex items-center justify-center text-white/50 text-sm">
          {track.provider} は未対応です
        </div>
      );
  }
};
