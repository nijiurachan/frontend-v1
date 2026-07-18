// ============================================================
// adapters/NiconicoEmbed.tsx
// ニコニコ動画 embed iframe — パッシブ埋め込み
// ニコニコの embed は JavaScript API を公開していないため、
// iframe を表示するだけで再生制御はユーザーが直接操作する。
// ============================================================

import { useEffect } from "react";
import type { SlotId } from "@/features/player/stores/playerStore";
import { usePlayerStore } from "@/features/player/stores/playerStore";

interface NiconicoEmbedProps {
  providerId: string;
  slotId: SlotId;
  onFullControlChange?: (hasFullControl: boolean) => void;
}

export const NiconicoEmbed: React.FunctionComponent<NiconicoEmbedProps> = ({
  providerId,
  slotId,
  onFullControlChange,
}: NiconicoEmbedProps) => {
  useEffect(() => {
    onFullControlChange?.(false);
  }, [onFullControlChange]);

  useEffect(() => {
    // ベストエフォートで playing 状態にする
    usePlayerStore.getState().setStatus(slotId, "playing");
    return (): void => {
      // アンマウント時にステータスをリセット
      usePlayerStore.getState().setStatus(slotId, "idle");
    };
  }, [slotId]);

  return (
    <iframe
      src={`https://embed.nicovideo.jp/watch/${providerId}`}
      className="w-full h-full border-0"
      allow="autoplay; fullscreen"
      allowFullScreen
      title={`ニコニコ動画 ${providerId}`}
    />
  );
};
