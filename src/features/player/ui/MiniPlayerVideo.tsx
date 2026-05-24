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
  onFullControlChange?: (hasFullControl: boolean) => void;
}

export const MiniPlayerVideo: React.FunctionComponent<MiniPlayerVideoProps> = ({
  currentTrack,
  slotId,
  onFullControlChange,
}: MiniPlayerVideoProps) => {
  if (!currentTrack) {
    return (
      <div className="relative w-full aspect-video bg-black flex items-center justify-center">
        <div className="text-white/30 text-sm">再生待機中</div>
      </div>
    );
  }

  return (
    <div className="relative w-full aspect-video bg-black">
      <EmbedDispatch
        key={`${currentTrack.provider}:${currentTrack.providerId}`}
        track={currentTrack}
        slotId={slotId}
        onFullControlChange={onFullControlChange}
      />
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
