import clsx from "clsx";
import type { IconType } from "react-icons";

export type PrimaryActionButtonProps = {
  icon: IconType;
  label: string;
  className?: string;
  onClick: () => void;
};

export const PrimaryActionButton: React.FunctionComponent<
  PrimaryActionButtonProps
> = ({ icon: Icon, label, className, onClick }: PrimaryActionButtonProps) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        "w-14 h-14 flex items-center justify-center bg-primary/80 hover:bg-primary text-primary-foreground rounded-full shadow-lg transition-colors z-30 cursor-pointer",
        className,
      )}
      aria-label={label}
      title={label}
    >
      <Icon size="50%" />
    </button>
  );
};
