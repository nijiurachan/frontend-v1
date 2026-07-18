import { type UseQueryResult, useQuery } from "@tanstack/react-query";
import type { ThreadSummary } from "@/entities/thread/types";
import { apiGet } from "@/shared/api/client";

const THREAD_BATCH_LIMIT = 100;

export function useHistoryThreads(
  mode: "viewed" | "posted",
  ids: string[],
): UseQueryResult<ThreadSummary[]> {
  return useQuery({
    queryKey: ["catalog-history", mode, ids],
    queryFn: async ({
      signal,
    }: {
      signal: AbortSignal;
    }): Promise<ThreadSummary[]> => {
      const batches: string[][] = [];
      for (let offset = 0; offset < ids.length; offset += THREAD_BATCH_LIMIT) {
        batches.push(ids.slice(offset, offset + THREAD_BATCH_LIMIT));
      }
      const results = await Promise.all(
        batches.map((batch) =>
          apiGet<ThreadSummary[]>(
            `/threads?ids=${batch.map(encodeURIComponent).join(",")}`,
            { signal },
          ),
        ),
      );
      return results.flat();
    },
    enabled: ids.length > 0,
    staleTime: 30_000,
  });
}
