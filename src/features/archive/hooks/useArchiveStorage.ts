import { type UseQueryResult, useQuery } from "@tanstack/react-query";
import type { ArchiveStorage } from "@/features/archive/types";
import { apiGet } from "@/shared/api";

export function useArchiveStorage(): UseQueryResult<ArchiveStorage> {
  return useQuery({
    queryKey: ["archive-storage"],
    queryFn: () => apiGet<ArchiveStorage>("/v1/archive/storage"),
    refetchOnWindowFocus: true,
  });
}
