import {
  type UseMutationResult,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { apiPost } from "@/shared/api";
import { getFingerprint } from "@/shared/lib/fingerprint";

interface DelResponse {
  del_count: number;
}

export function useDelMutation(): UseMutationResult<
  DelResponse,
  unknown,
  number
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (postId: number) => {
      const fingerprint = await getFingerprint();
      return apiPost<DelResponse>(`/post/${postId}/del`, {
        fingerprint,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["thread"] });
      queryClient.invalidateQueries({ queryKey: ["threads"] });
      console.info("delしました");
    },
    onError: (error: unknown, postId: number) => {
      console.warn("delに失敗しました", { error, postId });
    },
  });
}
