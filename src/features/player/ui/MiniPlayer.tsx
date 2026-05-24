// ============================================================
// MiniPlayer.tsx
// フローティングミニプレイヤー — ルートレイアウトに配置
// 旧SP版AI_BBSの VideoPlayer から意匠を継承:
//   - ヘッダのフリックで画面4隅を遷移
//   - 大中小3段階のサイズ切り替え
// ============================================================

import { AnimatePresence, motion } from "motion/react";
import { useCallback, useState } from "react";
import { usePlayerAPI } from "../hooks/usePlayerAPI";
import type { Track } from "../stores/playerStore";
import { usePlayerStore } from "../stores/playerStore";
import { MiniPlayerControls } from "./MiniPlayerControls";
import { MiniPlayerHeader } from "./MiniPlayerHeader";
import { MiniPlayerVideo } from "./MiniPlayerVideo";

/** トラックがライブ配信かどうかを判定 */
function isLiveTrack(track: Track | null): boolean {
  if (!track) return false;
  // Twitch channel: ライブ配信
  if (track.provider === "twitch" && track.providerId.startsWith("channel:")) {
    return true;
  }
  return false;
}

// ----------------------------------------------------------
// サイズ定義（旧プレイヤー踏襲）
// ----------------------------------------------------------

const MINI_SIZES = [
  "w-[min(250px,calc(100vw-16px))]", // sm
  "w-[min(350px,calc(100vw-16px))]", // md
  "w-[min(500px,calc(100vw-16px))]", // lg
] as const;

// ----------------------------------------------------------
// ポジション → スタイル変換
// ----------------------------------------------------------

function getPositionClasses(position: string): string {
  switch (position) {
    case "br":
      return "bottom-[58px] right-2";
    case "tr":
      return "top-2 right-2";
    case "tl":
      return "top-2 left-2";
    case "bl":
      return "bottom-[58px] left-2";
    default:
      return "bottom-[58px] right-2";
  }
}

// ----------------------------------------------------------
// コンポーネント
// ----------------------------------------------------------

export const MiniPlayer: React.FunctionComponent = () => {
  const { stop, next, prev, pause, resume } = usePlayerAPI();

  const visible = usePlayerStore((s) => s.miniPlayer.visible);
  const position = usePlayerStore((s) => s.miniPlayer.position);
  const sizeIndex = usePlayerStore((s) => s.miniPlayer.sizeIndex);
  const currentTrack = usePlayerStore((s) => s.players.primary.currentTrack);
  const status = usePlayerStore((s) => s.players.primary.status);
  const currentTime = usePlayerStore((s) => s.players.primary.currentTime);
  const muted = usePlayerStore((s) => s.players.primary.muted);
  const mode = usePlayerStore((s) => s.playlist.mode);
  const setMiniPlayerPosition = usePlayerStore((s) => s.setMiniPlayerPosition);
  const cycleMiniPlayerSize = usePlayerStore((s) => s.cycleMiniPlayerSize);
  const setMuted = usePlayerStore((s) => s.setMuted);

  // プロバイダーが完全な制御をサポートするかどうか
  const [hasFullControl, setHasFullControl] = useState(true);

  const handleFullControlChange = useCallback(
    (value: boolean): void => setHasFullControl(value),
    [],
  );

  const isLive = isLiveTrack(currentTrack);
  // コントロールバーの表示条件:
  // - ライブ配信 → play/pause + mute のみ表示
  // - 単品再生 / 連続再生 → 非表示（スペース確保）
  const showControls = isLive;

  const handleToggleMute = useCallback((): void => {
    setMuted("primary", !muted);
  }, [setMuted, muted]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className={`fixed z-30 rounded-lg shadow-2xl overflow-hidden ${MINI_SIZES[sizeIndex]} ${getPositionClasses(position)}`}
          initial={{ y: 40, scale: 0.95 }}
          animate={{ y: 0, scale: 1 }}
          exit={{ y: 40, scale: 0.95 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          layout
        >
          <MiniPlayerHeader
            position={position}
            sizeIndex={sizeIndex}
            onPositionChange={setMiniPlayerPosition}
            onCycleSize={cycleMiniPlayerSize}
            onClose={stop}
          />

          <MiniPlayerVideo
            currentTrack={currentTrack}
            slotId="primary"
            onFullControlChange={handleFullControlChange}
          />

          {showControls && (
            <MiniPlayerControls
              status={status}
              mode={mode}
              currentTime={currentTime}
              duration={currentTrack?.duration}
              hasFullControl={hasFullControl}
              isLive={isLive}
              muted={muted}
              onPlay={resume}
              onPause={pause}
              onNext={next}
              onPrev={prev}
              onStop={stop}
              onToggleMute={handleToggleMute}
            />
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};
