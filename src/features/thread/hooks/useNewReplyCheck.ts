import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { apiGet } from "@/shared/api";
import { useThread } from "./useThread";

interface NewReplyCheckResponse {
  count: number;
}

interface NewReplyCheckResult {
  newCount: number;
}

export function useNewReplyCheck(threadId: number): NewReplyCheckResult {
  const { data: threadData } = useThread(threadId);
  const latestPostId = threadData?.posts.at(-1)?.id;
  const [isVisible, setIsVisible] = useState<boolean>(
    () =>
      typeof document === "undefined" || document.visibilityState === "visible",
  );

  useEffect(() => {
    const handleVisibilityChange = (): void => {
      setIsVisible(document.visibilityState === "visible");
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return (): void => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  const { data } = useQuery({
    queryKey: ["thread-new-replies", threadId, latestPostId],
    queryFn: () =>
      apiGet<NewReplyCheckResponse>(
        `/v1/thread/${threadId}/new?after=${latestPostId}`,
      ),
    enabled: Boolean(threadId && latestPostId && isVisible),
    refetchInterval: 30_000,
    refetchIntervalInBackground: false,
  });

  return { newCount: data?.count ?? 0 };
}
