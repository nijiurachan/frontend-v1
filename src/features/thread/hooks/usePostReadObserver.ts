import { useCallback, useEffect, useRef } from "react";
import type { Post } from "@/entities/post";

type PostSentinelRef = (element: HTMLSpanElement | null) => void;

/**
 * レスの真下に置いた sentinel が画面に映った時、そのレスを既読とみなす。
 */
export function usePostReadObserver(
  onPostFullyVisible: ((replyNumberInThread: number) => void) | undefined,
  visiblePosts: Post[],
): (replyNumberInThread: number) => PostSentinelRef {
  const postSentinelsRef = useRef(new Map<Element, number>());
  const sentinelRefsRef = useRef(new Map<number, PostSentinelRef>());
  const observerRef = useRef<IntersectionObserver>(null);

  // biome-ignore lint/correctness/useExhaustiveDependencies(visiblePosts): 可視レスが変化したら observer を立て直す
  useEffect(() => {
    if (!onPostFullyVisible) return;
    const visibleReplyNumbers = new Set<number>();
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        const replyNumber = postSentinelsRef.current.get(entry.target);
        if (replyNumber == null) continue;
        if (entry.isIntersecting) visibleReplyNumbers.add(replyNumber);
        else visibleReplyNumbers.delete(replyNumber);
      }

      const latestReplyNumber =
        getLatestVisibleReplyNumber(visibleReplyNumbers);
      if (latestReplyNumber !== undefined) {
        onPostFullyVisible(latestReplyNumber);
      }
    });

    observerRef.current = observer;
    for (const element of postSentinelsRef.current.keys()) {
      observer.observe(element);
    }

    return (): void => {
      observerRef.current = null;
      observer.disconnect();
    };
  }, [onPostFullyVisible, visiblePosts]);

  return useCallback((replyNumberInThread: number): PostSentinelRef => {
    const cachedRef = sentinelRefsRef.current.get(replyNumberInThread);
    if (cachedRef) return cachedRef;

    const sentinelRef: PostSentinelRef = (
      element: HTMLSpanElement | null,
    ): void => {
      const oldElement = [...postSentinelsRef.current].find(
        (entry) => entry[1] === replyNumberInThread,
      )?.[0];

      if (oldElement) {
        observerRef.current?.unobserve(oldElement);
        postSentinelsRef.current.delete(oldElement);
      }

      if (element) {
        postSentinelsRef.current.set(element, replyNumberInThread);
        observerRef.current?.observe(element);
      }
    };

    sentinelRefsRef.current.set(replyNumberInThread, sentinelRef);
    return sentinelRef;
  }, []);
}

export function getLatestVisibleReplyNumber(
  visibleReplyNumbers: Iterable<number>,
): number | undefined {
  const latestReplyNumber = Math.max(...visibleReplyNumbers);
  return Number.isFinite(latestReplyNumber) ? latestReplyNumber : undefined;
}
