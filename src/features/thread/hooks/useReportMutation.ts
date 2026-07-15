import { type UseMutationResult, useMutation } from "@tanstack/react-query";
import { apiPost } from "@/shared/api";

export interface ReportParams {
  postId: number;
  reason: string;
}

interface ReportResponse {
  report_id: number;
}

export function useReportMutation(): UseMutationResult<
  ReportResponse,
  unknown,
  ReportParams
> {
  return useMutation({
    mutationFn: ({ postId, reason }: ReportParams) =>
      apiPost<ReportResponse>("/report", {
        post_id: postId,
        reason,
      }),
  });
}
