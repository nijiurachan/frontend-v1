import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { FiRefreshCw } from "react-icons/fi";

interface NewRepliesBannerProps {
  threadId: number;
  newCount: number;
}

export const NewRepliesBanner: React.FunctionComponent<
  NewRepliesBannerProps
> = ({ threadId, newCount }: NewRepliesBannerProps) => {
  const queryClient = useQueryClient();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async (): Promise<void> => {
    if (isRefreshing) return;

    setIsRefreshing(true);
    try {
      await queryClient.invalidateQueries({ queryKey: ["thread", threadId] });
    } finally {
      setIsRefreshing(false);
    }
  };

  if (newCount <= 0) return null;

  return (
    <button
      type="button"
      className="fixed left-2 right-16 bottom-[calc(58px+env(safe-area-inset-bottom))] z-30 flex items-center justify-center gap-2 rounded-lg border border-primary bg-primary px-4 py-3 text-sm font-medium text-primary-foreground shadow-lg transition-colors hover:bg-primary/90 disabled:cursor-wait disabled:opacity-70"
      onClick={(): void => {
        void handleRefresh();
      }}
      disabled={isRefreshing}
      aria-live="polite"
    >
      <FiRefreshCw
        aria-hidden="true"
        className={isRefreshing ? "animate-spin" : ""}
      />
      新着レスが {newCount} 件あります
    </button>
  );
};
