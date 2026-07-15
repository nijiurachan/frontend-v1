import {
  type UseMutationResult,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { ApiError, apiPost } from "@/shared/api";
import { toast } from "@/shared/ui/toast";

interface CloseResponse {
  [key: string]: unknown;
}

function isInvalidPasswordError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  const message = error.message.toLowerCase();
  return (
    (error instanceof ApiError && error.status === 403) ||
    message.includes("invalid password") ||
    message.includes("削除キー")
  );
}

export function useCloseMutation(
  threadId: number,
): UseMutationResult<CloseResponse, unknown, string> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (password: string): Promise<CloseResponse> => {
      const formData = new FormData();
      formData.append("thread_id", String(threadId));
      formData.append("password", password);

      return apiPost<CloseResponse>("/close", formData);
    },
    onSuccess: (): void => {
      queryClient.invalidateQueries({ queryKey: ["thread", threadId] });
      toast.success("スレッドを閉じました (5分後に落ちます)");
    },
    onError: (error: unknown): void => {
      if (isInvalidPasswordError(error)) {
        toast.error("削除キーが一致しません");
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
