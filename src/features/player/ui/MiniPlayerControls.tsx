// ============================================================
// MiniPlayerControls.tsx
// 再生制御ボタン + プログレスバー
// ============================================================

import {
  FiPause,
  FiPlay,
  FiSkipBack,
  FiSkipForward,
  FiSquare,
  FiVolume2,
  FiVolumeX,
} from "react-icons/fi";
import type { PlaybackStatus, PlayMode } from "../stores/playerStore";

interface MiniPlayerControlsProps {
  status: PlaybackStatus;
  mode: PlayMode | null;
  currentTime: number;
  duration: number | undefined;
  hasFullControl: boolean;
  isLive?: boolean;
  muted?: boolean;
  onPlay: () => void;
  onPause: () => void;
  onNext: () => void;
  onPrev: () => void;
  onStop: () => void;
  onToggleMute?: () => void;
}

export const MiniPlayerControls: React.FunctionComponent<
  MiniPlayerControlsProps
> = ({
  status,
  mode,
  currentTime,
  duration,
  hasFullControl,
  isLive,
  muted,
  onPlay,
  onPause,
  onNext,
  onPrev,
  onStop,
  onToggleMute,
}: MiniPlayerControlsProps) => {
  const isPlaying = status === "playing";
  const isPlaylist = mode === "playlist";

  // ライブ配信: play/pause + mute のみ
  if (isLive) {
    return (
      <div className="bg-black/80">
        <div className="flex items-center justify-center gap-2 px-2 py-1">
          {onToggleMute && (
            <ControlButton
              onClick={onToggleMute}
              label={muted ? "ミュート解除" : "ミュート"}
            >
              {muted ? (
                <FiVolumeX className="w-5 h-5" />
              ) : (
                <FiVolume2 className="w-5 h-5" />
              )}
            </ControlButton>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-black/80">
      {/* コントロールボタン */}
      <div className="flex items-center justify-center gap-2 px-2 py-1">
        {/* Prev（playlist 時のみ） */}
        {isPlaylist && hasFullControl && (
          <ControlButton onClick={onPrev} label="前のトラック">
            <FiSkipBack className="w-4 h-4" />
          </ControlButton>
        )}

        {/* Play / Pause（フル制御時のみ） */}
        {hasFullControl && (
          <ControlButton
            onClick={isPlaying ? onPause : onPlay}
            label={isPlaying ? "一時停止" : "再生"}
          >
            {isPlaying ? (
              <FiPause className="w-5 h-5" />
            ) : (
              <FiPlay className="w-5 h-5" />
            )}
          </ControlButton>
        )}

        {/* Next（playlist 時のみ） */}
        {isPlaylist && hasFullControl && (
          <ControlButton onClick={onNext} label="次のトラック">
            <FiSkipForward className="w-4 h-4" />
          </ControlButton>
        )}

        {/* Stop */}
        <ControlButton onClick={onStop} label="停止">
          <FiSquare className="w-3.5 h-3.5" />
        </ControlButton>
      </div>

      {/* プログレスバー（フル制御 + duration がある場合のみ） */}
      {hasFullControl && duration != null && duration > 0 && (
        <div className="w-full h-[3px] bg-white/10">
          <div
            className="h-full bg-primary transition-[width] duration-300"
            style={{
              width: `${Math.min((currentTime / duration) * 100, 100)}%`,
            }}
          />
        </div>
      )}
    </div>
  );
};

// ----------------------------------------------------------
// 共通ボタン
// ----------------------------------------------------------

interface ControlButtonProps {
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}

const ControlButton: React.FunctionComponent<ControlButtonProps> = ({
  onClick,
  label,
  children,
}: ControlButtonProps) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-8 h-8 flex items-center justify-center text-white/80 hover:text-white rounded-full hover:bg-white/15 transition-colors cursor-pointer"
      aria-label={label}
    >
      {children}
    </button>
  );
};
