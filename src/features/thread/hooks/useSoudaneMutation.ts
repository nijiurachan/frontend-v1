import type { UseMutationResult } from "@tanstack/react-query";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { isDuplicateSoudaneError } from "@/features/thread/hooks/soudaneError";
import { apiPut } from "@/shared/api";
import { getApiErrorMessage } from "@/shared/ui/feedback/apiErrorMessage";
import { toast } from "@/shared/ui/toast";

interface ReactionResponse {
  postId: string;
  type: "up";
}

export function useSoudaneMutation(): UseMutationResult<
  ReactionResponse,
  unknown,
  string
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (postId: string) => {
      try {
        return await apiPut<ReactionResponse>(`/posts/${postId}/reactions/up`, {
          requiresToken: true,
        });
      } catch (error) {
        if (isDuplicateSoudaneError(error)) return { postId, type: "up" };
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["thread"] });
      console.info("そうだねしました");
    },
    onError: (error: unknown, postId: string) => {
      console.warn("そうだねに失敗しました", { error, postId });
      toast.error(getApiErrorMessage(error, "そうだねの送信に失敗しました"));
    },
  });
}
