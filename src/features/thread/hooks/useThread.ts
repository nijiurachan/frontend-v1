import {
  type UseQueryResult,
  useQueries,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Post } from "@/entities/post";
import type {
  ThreadChunkElement,
  ThreadState,
  ThreadView,
} from "@/entities/thread";
import {
  createFailedThreadChunkRefetchFilters,
  getThreadChunkStaleTime,
  hasCompleteThreadChunkSnapshot,
  resolveThreadQueryError,
  THREAD_CHUNK_QUERY_BEHAVIOR,
  THREAD_CHUNK_SIZE,
} from "@/features/thread/hooks/threadChunkQuery";
import { mergeThreadChunkElements } from "@/features/thread/utils/threadChunks";
import { mergeThreadPosts } from "@/features/thread/utils/threadPosts";
import { apiGet } from "@/shared/api";
import {
  runAimogeDataHook,
  useAimogeHookGeneration,
} from "@/shared/lib/aimoge";
import { isThreadInitialLoading } from "@/shared/ui/feedback/threadLoadingState";

export { THREAD_CHUNK_SIZE } from "@/features/thread/hooks/threadChunkQuery";
export const THREAD_STATE_POLL_INTERVAL = 15_000;

export interface UseThreadResult
  extends Omit<UseQueryResult<ThreadView>, "data" | "refetch" | "promise"> {
  data: ThreadView | undefined;
  refetch: () => Promise<void>;
  newPostsCount: number;
  acceptNewPosts: () => void;
  isArchived: boolean;
  postsContentVersion: number;
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
  const archiveFromOption = Boolean(options.archivedAt);
  const aimogeGeneration = useAimogeHookGeneration();
  const queryClient = useQueryClient();
  const [acceptedNewPosts, setAcceptedNewPosts] = useState<
    ThreadChunkElement[]
  >([]);
  const [initialChunkCount, setInitialChunkCount] = useState<number | null>(
    null,
  );
  const [postCache, setPostCache] = useState<Post[]>([]);
  const [contentSnapshot, setContentSnapshot] = useState<{
    posts: Post[] | undefined;
    version: number;
  }>({ posts: undefined, version: 0 });
  const latestAcceptedSeqRef = useRef(0);
  const previousStateBySeqRef = useRef(
    new Map<number, ThreadState["postStates"][number]>(),
  );

  // biome-ignore lint/correctness/useExhaustiveDependencies: threadId changes reset hook-local accepted state
  useEffect(() => {
    // threadId changes are a deliberate state reset for this hook instance.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAcceptedNewPosts([]);
    setInitialChunkCount(null);
    latestAcceptedSeqRef.current = 0;
    setPostCache([]);
    previousStateBySeqRef.current = new Map();
    setContentSnapshot({ posts: undefined, version: 0 });
  }, [threadId]);

  const stateQuery = useQuery<ThreadState>({
    queryKey: ["thread", threadId, "state"],
    queryFn: () => {
      const after = latestAcceptedSeqRef.current;
      return apiGet<ThreadState>(
        `/threads/${threadId}/state?after=${encodeURIComponent(after)}`,
        { cache: "no-store" },
      );
    },
    enabled: Boolean(threadId) && !archiveFromOption,
    staleTime: 0,
    refetchInterval: (query: { state: { data: ThreadState | undefined } }) =>
      query.state.data?.archivedAt ? false : THREAD_STATE_POLL_INTERVAL,
    refetchIntervalInBackground: false,
  });

  const stateData = useMemo(() => {
    void aimogeGeneration;
    if (!stateQuery.data) return undefined;
    return runAimogeDataHook("data:state", stateQuery.data);
  }, [aimogeGeneration, stateQuery.data]);
  const isArchiveView = archiveFromOption || Boolean(stateData?.archivedAt);

  const fullThreadQuery = useQuery<ThreadView>({
    queryKey: ["thread", threadId, "full"],
    queryFn: () =>
      apiGet<ThreadView>(`/threads/${encodeURIComponent(threadId)}`, {
        cache: "force-cache",
      }),
    enabled: Boolean(threadId) && isArchiveView,
    staleTime: Infinity,
  });

  const fullThreadData = useMemo(() => {
    void aimogeGeneration;
    if (!fullThreadQuery.data) return undefined;
    return runAimogeDataHook("data:thread", fullThreadQuery.data);
  }, [aimogeGeneration, fullThreadQuery.data]);

  useEffect(() => {
    if (initialChunkCount !== null || !stateData || isArchiveView) return;
    // Pagination is initialized from the first state snapshot and must not
    // expand before the user accepts state.newPosts from the banner.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setInitialChunkCount(
      Math.max(1, Math.floor(stateData.replyCount / THREAD_CHUNK_SIZE) + 1),
    );
  }, [initialChunkCount, isArchiveView, stateData]);

  const acceptedMaxSeq = acceptedNewPosts.reduce(
    (maxSeq, element) => Math.max(maxSeq, element.seq),
    0,
  );
  const requiredInitialChunkCount =
    initialChunkCount ??
    (stateData
      ? Math.max(1, Math.floor(stateData.replyCount / THREAD_CHUNK_SIZE) + 1)
      : 1);
  const chunkCount = Math.max(
    requiredInitialChunkCount,
    Math.floor(acceptedMaxSeq / THREAD_CHUNK_SIZE) + 1,
  );

  const chunkQueries = useQueries({
    queries: Array.from({ length: chunkCount }, (_, chunkNumber) => ({
      queryKey: ["thread", threadId, "chunk", chunkNumber],
      queryFn: () =>
        apiGet<ThreadChunkElement[]>(
          `/threads/${threadId}/chunks/${chunkNumber}`,
        ),
      enabled: Boolean(threadId) && Boolean(stateData) && !isArchiveView,
      staleTime: (query: {
        state: { data: ThreadChunkElement[] | undefined };
      }) => getThreadChunkStaleTime(query.state.data),
      ...THREAD_CHUNK_QUERY_BEHAVIOR,
    })),
  });

  const chunkElements = useMemo(() => {
    void aimogeGeneration;
    const transformedChunks = chunkQueries.flatMap((query) => {
      const elements = query.data ?? [];
      return runAimogeDataHook("data:chunk", elements);
    });
    return transformedChunks.sort((left, right) => left.seq - right.seq);
  }, [aimogeGeneration, chunkQueries]);

  const hasCompleteChunkSnapshot = hasCompleteThreadChunkSnapshot(
    chunkQueries.map((query) => query.data),
    requiredInitialChunkCount,
  );

  const visibleNewPosts = useMemo(() => {
    const knownSeqs = new Set(chunkElements.map((element) => element.seq));
    const acceptedSeqs = new Set(
      acceptedNewPosts.map((element) => element.seq),
    );
    return (stateData?.newPosts ?? []).filter(
      (element) =>
        !knownSeqs.has(element.seq) && !acceptedSeqs.has(element.seq),
    );
  }, [acceptedNewPosts, chunkElements, stateData?.newPosts]);

  const data = useMemo<ThreadView | undefined>(() => {
    void aimogeGeneration;
    if (isArchiveView) return fullThreadData;
    if (!stateData || !hasCompleteChunkSnapshot) return undefined;

    const allElements = mergeThreadChunkElements(
      acceptedNewPosts,
      chunkElements,
    );
    const posts = mergeThreadPosts(
      threadId,
      allElements,
      stateData.postStates,
      postCache,
    );
    const firstPost = posts[0];

    return runAimogeDataHook("data:thread", {
      id: threadId,
      replyCount: stateData.replyCount,
      createdAt: firstPost?.createdAt ?? stateData.bumpedAt,
      bumpedAt: stateData.bumpedAt,
      tags: stateData.tags,
      posts,
      closedAt: stateData.closedAt,
      allowImageReplies: stateData.allowImageReplies,
      archivedAt: stateData.archivedAt ?? null,
    });
  }, [
    acceptedNewPosts,
    aimogeGeneration,
    chunkElements,
    fullThreadData,
    hasCompleteChunkSnapshot,
    isArchiveView,
    postCache,
    stateData,
    threadId,
  ]);

  useEffect(() => {
    if (isArchiveView || !data || data.posts === postCache) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPostCache(data.posts);
  }, [data, isArchiveView, postCache]);

  const postsContentVersion = contentSnapshot.version;

  useEffect(() => {
    if (!data) return;
    if (
      contentSnapshot.posts &&
      !havePostContentsChanged(contentSnapshot.posts, data.posts)
    ) {
      return;
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setContentSnapshot({
      posts: data.posts,
      version: contentSnapshot.version + 1,
    });
  }, [contentSnapshot, data]);

  useEffect(() => {
    if (isArchiveView || !stateData) return;
    const previousStates = previousStateBySeqRef.current;
    for (const state of stateData.postStates) {
      const previous = previousStates.get(state.seq);
      if (
        previous &&
        previous.status !== "public" &&
        state.status === "public"
      ) {
        void queryClient.invalidateQueries({
          queryKey: [
            "thread",
            threadId,
            "chunk",
            Math.floor(state.seq / THREAD_CHUNK_SIZE),
          ],
        });
      }
      previousStates.set(state.seq, state);
    }
  }, [isArchiveView, queryClient, stateData, threadId]);

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
      mergeThreadChunkElements(current, visibleNewPosts),
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
    await Promise.all([
      stateRefetch(),
      queryClient.refetchQueries(
        createFailedThreadChunkRefetchFilters(threadId),
      ),
    ]);
  }, [fullThreadRefetch, isArchiveView, queryClient, stateRefetch, threadId]);

  const isChunkLoading = chunkQueries.some((query) => query.isLoading);
  const chunkError = chunkQueries.find((query) => query.error)?.error;
  const activeQuery = isArchiveView ? fullThreadQuery : stateQuery;
  const isLoading = isThreadInitialLoading(
    activeQuery.isLoading,
    isArchiveView,
    Boolean(stateData),
    isChunkLoading,
  );

  return {
    ...activeQuery,
    data,
    error: resolveThreadQueryError(
      activeQuery.error,
      chunkError ?? null,
      isArchiveView,
      isArchiveView ? Boolean(fullThreadData) : hasCompleteChunkSnapshot,
    ),
    isLoading,
    isPending: isLoading,
    isFetching:
      activeQuery.isFetching ||
      (!isArchiveView && chunkQueries.some((query) => query.isFetching)),
    refetch,
    newPostsCount: isArchiveView ? 0 : visibleNewPosts.length,
    acceptNewPosts,
    isArchived: isArchiveView || Boolean(data?.archivedAt),
    postsContentVersion,
  };
}

function havePostContentsChanged(
  previousPosts: Post[],
  nextPosts: Post[],
): boolean {
  if (previousPosts.length !== nextPosts.length) return true;
  return nextPosts.some((post, index) => {
    const previous = previousPosts[index];
    return (
      !previous ||
      previous.id !== post.id ||
      previous.status !== post.status ||
      previous.body !== post.body ||
      previous.createdAt !== post.createdAt ||
      previous.attachment !== post.attachment ||
      previous.displayId !== post.displayId
    );
  });
}
