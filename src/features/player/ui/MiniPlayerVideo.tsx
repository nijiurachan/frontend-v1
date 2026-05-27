// ============================================================
// MiniPlayerVideo.tsx
// 動画エリア: プロバイダーに応じた埋め込みコンポーネントに切り替え
// ============================================================

import { NativeVideoEmbed } from "../adapters/NativeVideoEmbed";
import { NiconicoEmbed } from "../adapters/NiconicoEmbed";
import { TwitchEmbed } from "../adapters/TwitchEmbed";
import { YouTubeEmbed } from "../adapters/YouTubeEmbed";
import type { SlotId, Track } from "../stores/playerStore";

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
          <EmbedDispatch
            key={currentTrack.provider}
            track={currentTrack}
            slotId={slotId}
            onFullControlChange={onFullControlChange}
          />
        )}
      </div>
    </div>
  );
};

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
