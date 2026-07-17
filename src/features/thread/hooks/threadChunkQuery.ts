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
