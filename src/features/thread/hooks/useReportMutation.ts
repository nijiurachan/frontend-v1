import { type UseMutationResult, useMutation } from "@tanstack/react-query";
import { apiPost } from "@/shared/api";

export type ReportReason = "spam" | "illegal" | "nsfw_violation" | "other";

export interface ReportParams {
  threadId: string;
  fromSeq: number;
  toSeq: number;
  reason: ReportReason;
  detail?: string;
}

export function useReportMutation(): UseMutationResult<
  unknown,
  unknown,
  ReportParams
> {
  return useMutation({
    mutationFn: ({
      threadId,
      fromSeq,
      toSeq,
      reason,
      detail,
    }: ReportParams): Promise<unknown> =>
      apiPost(
        `/threads/${encodeURIComponent(threadId)}/report`,
        {
          fromSeq,
          toSeq,
          reason,
          ...(detail?.trim() ? { detail: detail.trim() } : {}),
        },
        { requiresToken: true },
      ),
  });
}
