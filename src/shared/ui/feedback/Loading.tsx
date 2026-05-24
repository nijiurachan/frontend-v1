import clsx from "clsx";

interface LoadingProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export const Loading: React.FunctionComponent<LoadingProps> = ({
  size = "md",
  className,
}: LoadingProps) => {
  return (
    <div
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

export const LoadingScreen: React.FunctionComponent = () => {
  return (
    <div className="flex items-center justify-center min-h-[200px]">
      <Loading size="lg" />
    </div>
  );
};
