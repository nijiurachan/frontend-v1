// src/features/jukebox/ui/PlayPauseButton.tsx
//
// ジュークボックスの再生/一時停止ボタン。
// グローバル MiniPlayer（豆サイズ）を開いて再生を開始する。
// 再生開始はユーザー操作（このクリック）に委ねることで、review #42 の
// 「ユーザー操作外で play() を呼ばない」不変条件を守る。
import { FiPause, FiPlay } from "react-icons/fi";
import { usePlayerStore } from "@/features/player/stores/playerStore";
import { cn } from "@/shared/lib/cn";

// MiniPlayer の「豆」（xs, 125px）サイズインデックス
const BEAN_SIZE_INDEX = 3;

interface PlayPauseButtonProps {
  /** 再生対象がないとき true → ボタンを無効化 */
  disabled: boolean;
}

export const PlayPauseButton: React.FunctionComponent<PlayPauseButtonProps> = ({
  disabled,
}: PlayPauseButtonProps) => {
  const status = usePlayerStore((s) => s.players.primary.status);
  const isPlaying = status === "playing";

  const handleClick = (): void => {
    const s = usePlayerStore.getState();
    if (isPlaying) {
      // 再生中 → 一時停止
      s.pause("primary");
      return;
    }
    // このクリックはユーザー操作。豆サイズの MiniPlayer を開いて再生開始する。
    s.setMiniPlayerSize(BEAN_SIZE_INDEX);
    s.setMiniPlayerVisible(true);
    s.play("primary");
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      className={cn(
        "flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium",
        "border border-border",
        isPlaying
          ? "bg-primary/10 text-primary"
          : "bg-primary text-primary-foreground hover:bg-primary/90",
        "disabled:opacity-40",
      )}
      aria-label={isPlaying ? "一時停止" : "再生"}
    >
      {isPlaying ? (
        <FiPause aria-hidden="true" size={16} />
      ) : (
        <FiPlay aria-hidden="true" size={16} />
      )}
      {isPlaying ? "一時停止" : "再生"}
    </button>
  );
};
