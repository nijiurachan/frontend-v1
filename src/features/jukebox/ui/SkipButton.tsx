// src/features/jukebox/ui/SkipButton.tsx
import { FiSkipForward } from "react-icons/fi";
import { cn } from "@/shared/lib/cn";

interface SkipButtonProps {
  mySkipVoted: boolean;
  onVote: () => void;
  isPending: boolean;
  disabled: boolean;
}

export const SkipButton: React.FunctionComponent<SkipButtonProps> = ({
  mySkipVoted,
  onVote,
  isPending,
  disabled,
}: SkipButtonProps) => {
  return (
    <button
      type="button"
      onClick={onVote}
      disabled={disabled || isPending || mySkipVoted}
      className={cn(
        "flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium",
        "border border-border",
        mySkipVoted
          ? "bg-primary/10 text-primary"
          : "bg-card text-foreground hover:bg-muted",
        "disabled:opacity-40",
      )}
      aria-pressed={mySkipVoted}
      aria-label={mySkipVoted ? "スキップ投票済み" : "スキップに投票"}
    >
      <FiSkipForward aria-hidden="true" size={16} />
      {mySkipVoted ? "投票済み" : "スキップ"}
    </button>
  );
};
