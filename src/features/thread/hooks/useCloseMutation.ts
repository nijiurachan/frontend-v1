import {
  type UseMutationResult,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { apiPost } from "@/shared/api";
import { toast } from "@/shared/ui/toast";

interface CloseResponse {
  changed?: boolean;
  [key: string]: unknown;
}

function isInvalidPasswordError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  const message = error.message.toLowerCase();
  // apiPost は HTTP status を ApiError に載せないため message ベースで判定する。
  // backend の CloseController::close が返す "Invalid password" 文言に依存する。
  return message.includes("invalid password");
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
    onSuccess: (data: CloseResponse): void => {
      queryClient.invalidateQueries({ queryKey: ["thread", threadId] });
      if (data.changed === false) {
        toast(
          "このスレッドは閉じられませんでした（既に短寿命または恒久スレです）",
        );
        return;
      }

      toast.success("スレッドを閉じました（閉店後まもなくスレが落ちます）");
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
