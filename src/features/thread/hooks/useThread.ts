import {
  type UseQueryResult,
  useQueries,
  useQuery,
} from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Post } from "@/entities/post";
import type {
  ThreadChunkElement,
  ThreadPostState,
  ThreadState,
  ThreadView,
} from "@/entities/thread";
import { isThreadChunkPost } from "@/entities/thread";
import { apiGet } from "@/shared/api";

export const THREAD_CHUNK_SIZE = 100;
export const THREAD_STATE_POLL_INTERVAL = 15_000;
const THREAD_TAIL_STALE_TIME = 15_000;

export interface UseThreadResult
  extends Omit<UseQueryResult<ThreadView>, "data" | "refetch" | "promise"> {
  data: ThreadView | undefined;
  refetch: () => Promise<void>;
  newPostsCount: number;
  acceptNewPosts: () => void;
  isArchived: boolean;
}

export interface UseThreadOptions {
  /** アーカイブ一覧から渡される archivedAt。指定時はフルJSONを1回だけ取得する。 */
  archivedAt?: string | null;
}

/**
 * 通常スレッドは不変チャンクと可変 state に分け、アーカイブはフルJSONで取得する。
 *
 * チャンクは seq の範囲をキーに持つため、state のポーリングで既読チャンクを
 * 再取得しない。state の newPosts はユーザーがバナーを押した時だけ表示列に
 * 取り込むので、表示中のレスが勝手に並び替わらない。
 */
export function useThread(
  threadId: string,
  options: UseThreadOptions = {},
): UseThreadResult {
  const isArchiveView = Boolean(options.archivedAt);
  const [acceptedNewPosts, setAcceptedNewPosts] = useState<
    ThreadChunkElement[]
  >([]);
  const [initialChunkCount, setInitialChunkCount] = useState<number | null>(
    null,
  );
  const latestAcceptedSeqRef = useRef(0);

  // biome-ignore lint/correctness/useExhaustiveDependencies: threadId changes reset hook-local accepted state
  useEffect(() => {
    // threadId changes are a deliberate state reset for this hook instance.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAcceptedNewPosts([]);
    setInitialChunkCount(null);
    latestAcceptedSeqRef.current = 0;
  }, [threadId]);

  const fullThreadQuery = useQuery<ThreadView>({
    queryKey: ["thread", threadId, "full"],
    queryFn: () =>
      apiGet<ThreadView>(`/threads/${encodeURIComponent(threadId)}`, {
        cache: "force-cache",
      }),
    enabled: Boolean(threadId) && isArchiveView,
    staleTime: Infinity,
  });

  const stateQuery = useQuery<ThreadState>({
    queryKey: ["thread", threadId, "state"],
    queryFn: () => {
      const after = latestAcceptedSeqRef.current;
      return apiGet<ThreadState>(
        `/threads/${threadId}/state?after=${encodeURIComponent(after)}`,
        { cache: "no-store" },
      );
    },
    enabled: Boolean(threadId) && !isArchiveView,
    staleTime: 0,
    refetchInterval: isArchiveView ? false : THREAD_STATE_POLL_INTERVAL,
    refetchIntervalInBackground: false,
  });

  useEffect(() => {
    if (initialChunkCount !== null || !stateQuery.data) return;
    // Pagination is initialized from the first state snapshot and must not
    // expand before the user accepts state.newPosts from the banner.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setInitialChunkCount(
      Math.max(
        1,
        Math.floor(stateQuery.data.replyCount / THREAD_CHUNK_SIZE) + 1,
      ),
    );
  }, [initialChunkCount, stateQuery.data]);

  const acceptedMaxSeq = acceptedNewPosts.reduce(
    (maxSeq, element) => Math.max(maxSeq, element.seq),
    0,
  );
  const chunkCount = Math.max(
    initialChunkCount ?? 1,
    Math.floor(acceptedMaxSeq / THREAD_CHUNK_SIZE) + 1,
  );

  const chunkQueries = useQueries({
    queries: Array.from({ length: chunkCount }, (_, chunkNumber) => ({
      queryKey: ["thread", threadId, "chunk", chunkNumber],
      queryFn: () =>
        apiGet<ThreadChunkElement[]>(
          `/threads/${threadId}/chunks/${chunkNumber}`,
        ),
      enabled: Boolean(threadId) && !isArchiveView,
      staleTime: (query: {
        state: { data: ThreadChunkElement[] | undefined };
      }) =>
        query.state.data?.length === THREAD_CHUNK_SIZE
          ? Infinity
          : THREAD_TAIL_STALE_TIME,
    })),
  });

  const chunkElements = useMemo(
    () =>
      chunkQueries
        .flatMap((query) => query.data ?? [])
        .sort((left, right) => left.seq - right.seq),
    [chunkQueries],
  );

  const visibleNewPosts = useMemo(() => {
    const knownSeqs = new Set(chunkElements.map((element) => element.seq));
    const acceptedSeqs = new Set(
      acceptedNewPosts.map((element) => element.seq),
    );
    return (stateQuery.data?.newPosts ?? []).filter(
      (element) =>
        !knownSeqs.has(element.seq) && !acceptedSeqs.has(element.seq),
    );
  }, [acceptedNewPosts, chunkElements, stateQuery.data?.newPosts]);

  const data = useMemo<ThreadView | undefined>(() => {
    if (isArchiveView) return fullThreadQuery.data;
    if (!stateQuery.data || chunkElements.length === 0) return undefined;

    const allElements = mergeChunkElements(chunkElements, acceptedNewPosts);
    const posts = allElements.map((element) =>
      normalizeChunkElement(threadId, element),
    );
    applyPostStates(posts, stateQuery.data.postStates);
    const firstPost = posts[0];

    return {
      id: threadId,
      replyCount: stateQuery.data.replyCount,
      createdAt: firstPost?.createdAt ?? stateQuery.data.bumpedAt,
      bumpedAt: stateQuery.data.bumpedAt,
      tags: stateQuery.data.tags,
      posts,
      closedAt: stateQuery.data.closedAt,
      allowImageReplies: stateQuery.data.allowImageReplies,
      archivedAt: stateQuery.data.archivedAt ?? null,
    };
  }, [
    acceptedNewPosts,
    chunkElements,
    fullThreadQuery.data,
    isArchiveView,
    stateQuery.data,
    threadId,
  ]);

  useEffect(() => {
    const maxSeq = data?.posts.at(-1)?.seq ?? 0;
    latestAcceptedSeqRef.current = Math.max(
      latestAcceptedSeqRef.current,
      maxSeq,
    );
  }, [data?.posts]);

  const acceptNewPosts = useCallback(() => {
    if (visibleNewPosts.length === 0) return;
    setAcceptedNewPosts((current) =>
      mergeChunkElements(current, visibleNewPosts),
    );
    latestAcceptedSeqRef.current = Math.max(
      latestAcceptedSeqRef.current,
      ...visibleNewPosts.map((element) => element.seq),
    );
  }, [visibleNewPosts]);

  const fullThreadRefetch = fullThreadQuery.refetch;
  const stateRefetch = stateQuery.refetch;
  const refetch = useCallback(async (): Promise<void> => {
    if (isArchiveView) {
      await fullThreadRefetch();
      return;
    }
    await stateRefetch();
  }, [fullThreadRefetch, isArchiveView, stateRefetch]);

  const isChunkLoading = chunkQueries.some((query) => query.isPending);
  const chunkError = chunkQueries.find((query) => query.error)?.error;
  const activeQuery = isArchiveView ? fullThreadQuery : stateQuery;

  return {
    ...activeQuery,
    data,
    error: activeQuery.error ?? (isArchiveView ? null : chunkError) ?? null,
    isLoading: activeQuery.isPending || (!isArchiveView && isChunkLoading),
    isPending: activeQuery.isPending || (!isArchiveView && isChunkLoading),
    isFetching:
      activeQuery.isFetching ||
      (!isArchiveView && chunkQueries.some((query) => query.isFetching)),
    refetch,
    newPostsCount: isArchiveView ? 0 : visibleNewPosts.length,
    acceptNewPosts,
    isArchived: isArchiveView || Boolean(data?.archivedAt),
  };
}

function mergeChunkElements(
  first: ThreadChunkElement[],
  second: ThreadChunkElement[],
): ThreadChunkElement[] {
  const bySeq = new Map<number, ThreadChunkElement>();
  for (const element of [...first, ...second]) bySeq.set(element.seq, element);
  return [...bySeq.values()].sort((left, right) => left.seq - right.seq);
}

function normalizeChunkElement(
  threadId: string,
  element: ThreadChunkElement,
): Post {
  if (!isThreadChunkPost(element)) {
    return {
      id: `unavailable-${threadId}-${element.seq}`,
      threadId,
      seq: element.seq,
      status: "unavailable",
      body: "",
      createdAt: "",
      attachment: null,
      sodaneCount: 0,
      displayId: null,
    };
  }

  return {
    ...element,
    threadId,
    status: "public",
    sodaneCount: 0,
  };
}

function applyPostStates(posts: Post[], postStates: ThreadPostState[]): void {
  const stateBySeq = new Map(postStates.map((state) => [state.seq, state]));
  for (const post of posts) {
    const state = stateBySeq.get(post.seq);
    if (!state) continue;
    post.status = state.status;
    post.sodaneCount = state.reactions.up;
    if (state.status === "unavailable") post.body = "";
  }
}
