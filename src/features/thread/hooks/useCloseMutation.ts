import {
  type UseMutationResult,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { ApiError, apiPost } from "@/shared/api";
import { toast } from "@/shared/ui/toast";

interface CloseResponse {
  closedAt?: string | null;
}

export function useCloseMutation(
  threadId: string,
): UseMutationResult<CloseResponse, unknown, string> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (deleteKey: string): Promise<CloseResponse> =>
      apiPost<CloseResponse>(
        `/threads/${encodeURIComponent(threadId)}/close`,
        { deleteKey },
        { requiresToken: true },
      ),
    onSuccess: (): void => {
      void queryClient.invalidateQueries({ queryKey: ["thread", threadId] });
      void queryClient.invalidateQueries({ queryKey: ["threads"] });
      toast.success("スレッドを閉じました");
    },
    onError: (error: unknown): void => {
      if (error instanceof ApiError && error.status === 403) {
        toast.error("削除キーが一致しないか、スレッドは既に閉鎖されています");
        return;
      }
      toast.error(
        error instanceof Error
          ? error.message
          : "スレッドを閉じられませんでした",
      );
    },
  });
}
