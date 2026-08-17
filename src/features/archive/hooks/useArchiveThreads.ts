import { type UseQueryResult, useQuery } from "@tanstack/react-query";
import type { ArchiveThreadsResponse } from "@/features/archive/types";
import { apiGet } from "@/shared/api";

export const ARCHIVE_PAGE_LIMIT = 100;

export function useArchiveThreads(
  page: number,
): UseQueryResult<ArchiveThreadsResponse> {
  const normalizedPage = Number.isFinite(page)
    ? Math.max(1, Math.floor(page))
    : 1;

  return useQuery({
    queryKey: ["archive-threads", normalizedPage],
    queryFn: () =>
      apiGet<ArchiveThreadsResponse>(
        `/v1/archive?page=${normalizedPage}&limit=${ARCHIVE_PAGE_LIMIT}`,
      ),
    refetchOnWindowFocus: true,
  });
}
