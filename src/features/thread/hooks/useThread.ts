import { type UseQueryResult, useQuery } from "@tanstack/react-query";
import type { ThreadDetailResponse } from "@/entities/thread";
import { apiGet } from "@/shared/api";

export const useThread = (
  threadId: string,
): UseQueryResult<ThreadDetailResponse> =>
  useQuery({
    queryKey: ["thread", threadId],
    queryFn: () => apiGet<ThreadDetailResponse>(`/threads/${threadId}`),
    enabled: !!threadId,
  });
