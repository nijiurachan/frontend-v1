import {
  type UseQueryResult,
  useQueries,
  useQuery,
} from "@tanstack/react-query";
import type {
  ThreadChunkPost,
  ThreadPostState,
  ThreadState,
  TopPage,
} from "@/entities/thread/types";
import { isThreadChunkPost } from "@/entities/thread/types";
import { THREAD_CHUNK_SIZE } from "@/features/thread/hooks/threadChunkQuery";
import { apiGet } from "@/shared/api/client";

export interface BoardThreadTail {
  threadId: string;
  posts: ThreadChunkPost[];
}

export function getBoardTailChunkNumbers(
  postStates: ThreadPostState[],
): number[] {
  const latestPublicReplySeqs = postStates
    .filter((postState) => postState.seq > 0 && postState.status === "public")
    .map((postState) => postState.seq)
    .sort((left, right) => left - right)
    .slice(-8);

  return [
    ...new Set(
      latestPublicReplySeqs.map((seq) => Math.floor(seq / THREAD_CHUNK_SIZE)),
    ),
  ].sort((left, right) => left - right);
}

export function useTopPage(): UseQueryResult<TopPage> {
  return useQuery({
    queryKey: ["top-page"],
    queryFn: ({ signal }: { signal: AbortSignal }) =>
      apiGet<TopPage>("/top", { signal }),
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  });
}

export function useBoardThreadTails(threadIds: string[]): {
  tails: Map<string, BoardThreadTail>;
  isFetching: boolean;
  hasError: boolean;
} {
  const queries = useQueries({
    queries: threadIds.map((threadId) => ({
      queryKey: ["board-thread-tail", threadId],
      queryFn: async ({
        signal,
      }: {
        signal: AbortSignal;
      }): Promise<BoardThreadTail> => {
        const state = await apiGet<ThreadState>(
          `/threads/${encodeURIComponent(threadId)}/state`,
          { signal, cache: "no-store" },
        );
        const publicSeqs = new Set(
          state.postStates
            .filter((postState) => postState.status === "public")
            .map((postState) => postState.seq),
        );
        const chunks = await Promise.all(
          getBoardTailChunkNumbers(state.postStates).map((chunkNumber) =>
            apiGet<
              Array<ThreadChunkPost | { seq: number; status: "unavailable" }>
            >(
              `/threads/${encodeURIComponent(threadId)}/chunks/${chunkNumber}`,
              {
                signal,
              },
            ),
          ),
        );
        return {
          threadId,
          posts: chunks
            .flat()
            .filter(isThreadChunkPost)
            .filter((post) => post.seq > 0 && publicSeqs.has(post.seq))
            .sort((left, right) => left.seq - right.seq)
            .slice(-8),
        };
      },
      enabled: Boolean(threadId),
      staleTime: 15_000,
      refetchOnWindowFocus: true,
    })),
  });

  const tails = new Map<string, BoardThreadTail>();
  for (const query of queries) {
    if (query.data) tails.set(query.data.threadId, query.data);
  }
  return {
    tails,
    isFetching: queries.some((query) => query.isFetching),
    hasError: queries.some((query) => query.isError),
  };
}
