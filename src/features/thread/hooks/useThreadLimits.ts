import { type UseQueryResult, useQuery } from "@tanstack/react-query";
import type { ThreadLimits } from "@/features/thread/utils/threadExpiry";
import { apiGet } from "@/shared/api";

export function useThreadLimits(): UseQueryResult<ThreadLimits> {
  return useQuery({
    queryKey: ["thread-limits"],
    queryFn: () =>
      apiGet<ThreadLimits>("/thread-limits", { cache: "no-store" }),
    staleTime: 30_000,
  });
}
