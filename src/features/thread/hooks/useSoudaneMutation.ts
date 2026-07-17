import type { UseMutationResult } from "@tanstack/react-query";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiPut } from "@/shared/api";
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
      return apiPut<ReactionResponse>(`/posts/${postId}/reactions/up`, {
        requiresToken: true,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["thread"] });
      console.info("そうだねしました");
    },
    onError: (error: unknown, postId: string) => {
      console.warn("そうだねに失敗しました", { error, postId });
      const message = error instanceof Error ? error.message : undefined;
      if (message === "すでに投票済みです") {
        toast.success(`そうだね済みです`);
      } else if (message) {
        toast.error(`エラー: ${message}`);
      } else {
        toast.error("そうだねの送信に失敗しました");
      }
    },
  });
}
