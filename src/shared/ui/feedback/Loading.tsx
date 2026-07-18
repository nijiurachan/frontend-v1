import clsx from "clsx";

interface LoadingProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

interface LoadingScreenProps {
  message?: string;
}

export const Loading: React.FunctionComponent<LoadingProps> = ({
  size = "md",
  className,
}: LoadingProps) => {
  return (
    <div
      aria-hidden="true"
      className={clsx(
        "animate-spin rounded-full border-2 border-muted border-t-primary",
        size === "sm" && "w-4 h-4",
        size === "md" && "w-8 h-8",
        size === "lg" && "w-12 h-12",
        className,
      )}
    />
  );
};

export const LoadingScreen: React.FunctionComponent<LoadingScreenProps> = ({
  message = "読み込み中...",
}: LoadingScreenProps) => {
  return (
    // biome-ignore lint/a11y/useSemanticElements: CodeRabbit要求によりstatus roleを明示する
    <div
      role="status"
      className="flex min-h-[200px] flex-col items-center justify-center gap-3 text-muted-foreground"
      aria-live="polite"
      aria-atomic="true"
    >
      <Loading size="lg" />
      <span className="text-sm">{message}</span>
    </div>
  );
};
