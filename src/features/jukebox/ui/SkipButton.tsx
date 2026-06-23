// src/features/jukebox/ui/SkipButton.tsx
import { FiSkipForward } from "react-icons/fi";
import { cn } from "@/shared/lib/cn";

interface SkipButtonProps {
  /** 再生中トラックに対し呼び出し元が除外投票済みか */
  myVoted: boolean;
  /** 投票をトグルする（再度押すと取消） */
  onVote: () => void;
  isPending: boolean;
  /** 再生中の曲が無いときのみ true */
  disabled: boolean;
}

export const SkipButton: React.FunctionComponent<SkipButtonProps> = ({
  myVoted,
  onVote,
  isPending,
  disabled,
}: SkipButtonProps) => {
  return (
    <button
      type="button"
      onClick={onVote}
      disabled={disabled || isPending}
      className={cn(
        "flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium",
        myVoted
          ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
          : "border border-border bg-card text-foreground hover:bg-muted",
        "disabled:opacity-40",
      )}
      aria-pressed={myVoted}
      aria-label={myVoted ? "スキップ投票を取り消す" : "スキップに投票"}
    >
      <FiSkipForward aria-hidden="true" size={16} />
      {myVoted ? "投票済み" : "スキップ"}
    </button>
  );
};
