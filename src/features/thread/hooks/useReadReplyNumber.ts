import { useRouter } from "@tanstack/react-router";
import { useCallback, useEffect, useRef } from "react";
import { useHistoryStore } from "@/features/history/stores";

/** 既読レス数の記録をページの更新・離脱時に保存する。 */
export function useReadReplyNumber(threadId: string): {
  handlePostFullyVisible: (replyNumberInThread: number) => void;
  handleRefresh: () => void;
} {
  const recordReadReplyNumber = useHistoryStore((s) => s.recordReadReplyNumber);
  const fullyVisibleReplyNumberRef = useRef(0);
  const router = useRouter();

  // biome-ignore lint/correctness/useExhaustiveDependencies(threadId): threadId changes require resetting the ref
  useEffect(() => {
    fullyVisibleReplyNumberRef.current = 0;
  }, [threadId]);

  const handlePostFullyVisible = useCallback(
    (replyNumberInThread: number): void => {
      fullyVisibleReplyNumberRef.current = replyNumberInThread;
    },
    [],
  );

  const handleRefresh = useCallback((): void => {
    recordReadReplyNumber(threadId, fullyVisibleReplyNumberRef.current);
  }, [recordReadReplyNumber, threadId]);

  useEffect(() => {
    function handlePageLeave(): void {
      recordReadReplyNumber(threadId, fullyVisibleReplyNumberRef.current);
    }

    document.addEventListener("visibilitychange", handlePageLeave);
    window.addEventListener("pagehide", handlePageLeave);
    const routerUnsubscribe = router.subscribe("onBeforeNavigate", (event) => {
      if (event.pathChanged) handlePageLeave();
    });

    return (): void => {
      routerUnsubscribe();
      window.removeEventListener("pagehide", handlePageLeave);
      document.removeEventListener("visibilitychange", handlePageLeave);
    };
  }, [recordReadReplyNumber, router, threadId]);

  return { handlePostFullyVisible, handleRefresh };
}
