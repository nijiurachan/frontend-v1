import { type UseMutationResult, useMutation } from "@tanstack/react-query";
import { apiPost } from "@/shared/api";

export type ReportReason = "spam" | "illegal" | "nsfw_violation" | "other";

export interface ReportParams {
  postId: string;
  reason: ReportReason;
  detail?: string;
}

export function useReportMutation(): UseMutationResult<
  unknown,
  unknown,
  ReportParams
> {
  return useMutation({
    mutationFn: ({ postId, reason, detail }: ReportParams): Promise<unknown> =>
      apiPost(
        `/posts/${encodeURIComponent(postId)}/report`,
        {
          reason,
          ...(detail?.trim() ? { detail: detail.trim() } : {}),
        },
        { requiresToken: true },
      ),
  });
}
