import { FiX } from "react-icons/fi";
import { cn } from "@/shared/lib";

export interface UpfileClearButtonProps {
  className?: string;
  onClick: () => void;
}

export const UpfileClearButton: React.FunctionComponent<
  UpfileClearButtonProps
> = ({ className, onClick }: UpfileClearButtonProps) => (
  <button
    type="button"
    aria-label="クリア"
    className={cn(
      "w-8 h-8 flex items-center justify-center bg-destructive text-destructive-foreground rounded-full shadow-md",
      className,
    )}
    onClick={onClick}
  >
    <FiX className="w-4 h-4" />
  </button>
);
