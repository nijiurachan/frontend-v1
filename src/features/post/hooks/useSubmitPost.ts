import {
  type UseMutationResult,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { apiPost } from "@/shared/api";

interface SubmitParams {
  formData: FormData;
  mode: "thread" | "reply";
}

export function useSubmitPost(): UseMutationResult<
  unknown,
  unknown,
  SubmitParams
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ formData, mode }: SubmitParams): Promise<unknown> => {
      const endpoint = mode === "thread" ? "/thread" : "/post";
      return apiPost(endpoint, formData);
    },
    onSuccess: (_: unknown, { mode }: SubmitParams): void => {
      if (mode === "thread") {
        queryClient.invalidateQueries({ queryKey: ["threads"] });
        // active_threads が増えてティア短縮が起きる可能性があるため
        // スレ立てフォームの duration 上限を再取得させる
        queryClient.invalidateQueries({ queryKey: ["thread-limits"] });
      } else {
        queryClient.invalidateQueries({ queryKey: ["thread"] });
      }
    },
    onError: (error: unknown): void => {
      alert(error instanceof Error ? error.message : "投稿に失敗しました");
    },
  });
}
