// ============================================================
// MiniPlayerControls.tsx
// 再生制御ボタン + プログレスバー
// ============================================================

import {
  FiRepeat,
  FiShuffle,
  FiSkipBack,
  FiSkipForward,
  FiVolume2,
  FiVolumeX,
} from "react-icons/fi";

interface MiniPlayerControlsProps {
  currentTime: number;
  duration: number | undefined;
  hasFullControl: boolean;
  isLive?: boolean;
  muted?: boolean;
  shuffle?: boolean;
  repeat?: "none" | "all" | "one";
  /** 現在のトラック位置（1始まり。シャッフル時は置換後配列での位置） */
  trackPosition?: number;
  /** トラック総数 */
  trackTotal?: number;
  onNext: () => void;
  onPrev: () => void;
  onToggleMute?: () => void;
  onToggleShuffle?: () => void;
  onCycleRepeat?: () => void;
}

export const MiniPlayerControls: React.FunctionComponent<
  MiniPlayerControlsProps
> = ({
  currentTime,
  duration,
  hasFullControl,
  isLive,
  muted,
  shuffle,
  repeat = "none",
  trackPosition,
  trackTotal,
  onNext,
  onPrev,
  onToggleMute,
  onToggleShuffle,
  onCycleRepeat,
}: MiniPlayerControlsProps) => {
  // ライブ配信: mute のみ（再生制御は埋め込みプレイヤー側に委ねる）
  if (isLive) {
    return (
      <div className="bg-black/80">
        <div className="flex items-center justify-center gap-1 px-2 h-[35px]">
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

  // 連続再生（playlist）モードのコントロール出力。
  // 現状このブロックは playlist 専用（単品は showControls=false で非描画、
  // ライブは上の早期 return で分岐済み）。今後モードが増えたらここで分岐する。
  // 再生/一時停止・停止は埋め込みプレイヤーの操作とヘッダの閉じるに委ねるため置かない。
  return (
    <div className="bg-black/80">
      <div className="flex items-center justify-center gap-1 px-2 h-[35px]">
        {/* Shuffle / Repeat（責務が近いので隣接配置） */}
        {onToggleShuffle && (
          <ControlButton
            onClick={onToggleShuffle}
            label={shuffle ? "シャッフル解除" : "シャッフル"}
            active={shuffle}
          >
            <FiShuffle className="w-4 h-4" />
          </ControlButton>
        )}
        {onCycleRepeat && (
          <ControlButton
            onClick={onCycleRepeat}
            label={
              repeat === "one"
                ? "リピート: 1曲"
                : repeat === "all"
                  ? "リピート: 全曲"
                  : "リピート: なし"
            }
            active={repeat !== "none"}
          >
            <span className="relative inline-flex">
              <FiRepeat className="w-4 h-4" />
              {repeat === "one" && (
                <span className="absolute -top-1.5 -right-1.5 text-[9px] font-bold leading-none">
                  1
                </span>
              )}
            </span>
          </ControlButton>
        )}

        {/* Prev / トラック位置 / Next */}
        <ControlButton onClick={onPrev} label="前のトラック">
          <FiSkipBack className="w-4 h-4" />
        </ControlButton>
        <span className="text-[10px] text-white/70 tabular-nums text-center select-none min-w-[2.75rem]">
          {trackPosition ?? 0}/{trackTotal ?? 0}
        </span>
        <ControlButton onClick={onNext} label="次のトラック">
          <FiSkipForward className="w-4 h-4" />
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
  active?: boolean;
  children: React.ReactNode;
}

const ControlButton: React.FunctionComponent<ControlButtonProps> = ({
  onClick,
  label,
  active,
  children,
}: ControlButtonProps) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-w-[38px] h-full flex items-center justify-center rounded-full hover:bg-white/15 transition-colors cursor-pointer ${
        active ? "text-primary" : "text-white/80 hover:text-white"
      }`}
      aria-label={label}
      aria-pressed={active}
    >
      {children}
    </button>
  );
};
