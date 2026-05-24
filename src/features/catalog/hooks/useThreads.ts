import { type UseQueryResult, useQuery } from "@tanstack/react-query";
import type { ThreadsResponse } from "@/entities/thread";
import { apiGet } from "@/shared/api";
import { useCatalogStore } from "../stores/catalogStore";

export function useThreads(): UseQueryResult<ThreadsResponse> {
  const { currentSort } = useCatalogStore();

  const query = useQuery({
    queryKey: ["threads", currentSort],
    queryFn: async () => {
      const sortParam =
        currentSort !== "default"
          ? `?sort=${currentSort}&limit=500`
          : "?limit=500";
      return apiGet<ThreadsResponse>(`/threads${sortParam}`);
    },
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  });

  return query;
}
