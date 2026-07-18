import type { Query, QueryFilters } from "@tanstack/react-query";
import type { ThreadChunkElement } from "@/entities/thread";

export const THREAD_CHUNK_SIZE = 100;
const THREAD_TAIL_STALE_TIME = 15_000;

export const THREAD_CHUNK_QUERY_BEHAVIOR = {
  refetchOnWindowFocus: false,
} as const;

export function getThreadChunkStaleTime(
  data: readonly unknown[] | undefined,
): number {
  return data?.length === THREAD_CHUNK_SIZE
    ? Number.POSITIVE_INFINITY
    : THREAD_TAIL_STALE_TIME;
}

export function createFailedThreadChunkRefetchFilters(
  threadId: string,
): QueryFilters {
  return {
    queryKey: ["thread", threadId, "chunk"],
    type: "active",
    predicate: (query: Query) => query.state.status === "error",
  };
}

export function hasCompleteThreadChunkSnapshot(
  chunks: readonly (readonly ThreadChunkElement[] | undefined)[],
  requiredChunkCount: number,
): boolean {
  if (requiredChunkCount < 1 || chunks.length < requiredChunkCount)
    return false;
  if (!chunks[0]?.some((element) => element.seq === 0)) return false;
  return chunks
    .slice(0, requiredChunkCount)
    .every((chunk) => chunk !== undefined);
}

export function resolveThreadQueryError(
  activeError: Error | null,
  chunkError: Error | null,
  isArchiveView: boolean,
  hasCompleteSnapshot: boolean,
): Error | null {
  if (activeError) return activeError;
  if (!isArchiveView && !hasCompleteSnapshot) return chunkError;
  return null;
}
