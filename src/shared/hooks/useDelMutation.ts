import {
  type UseMutationResult,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { apiPut } from "@/shared/api";

interface ReactionResponse {
  postId: string;
  type: "del";
}

export function useDelMutation(): UseMutationResult<
  ReactionResponse,
  unknown,
  string
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (postId: string) => {
      return apiPut<ReactionResponse>(`/posts/${postId}/reactions/del`, {
        requiresToken: true,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["thread"] });
      queryClient.invalidateQueries({ queryKey: ["threads"] });
      console.info("delしました");
    },
    onError: (error: unknown, postId: string) => {
      console.warn("delに失敗しました", { error, postId });
    },
  });
}
