import type { UseMutationResult } from "@tanstack/react-query";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiPost } from "@/shared/api";
import { getFingerprint } from "@/shared/lib/fingerprint";
import { toast } from "@/shared/ui/toast";

interface SoudaneResponse {
  soudane_count: number;
}

export function useSoudaneMutation(): UseMutationResult<
  SoudaneResponse,
  unknown,
  number
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (postId: number) => {
      const fingerprint = await getFingerprint();
      return apiPost<SoudaneResponse>(`/post/${postId}/soudane`, {
        fingerprint,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["thread"] });
      console.info("そうだねしました");
    },
    onError: (error: unknown, postId: number) => {
      console.warn("そうだねに失敗しました", { error, postId });
      const message = error instanceof Error ? error.message : undefined;
      if (message === "そうだね済みです") {
        toast.success(`そうだね済みです`);
      } else if (message) {
        toast.error(`エラー: ${message}`);
      } else {
        toast.error("そうだねの送信に失敗しました");
      }
    },
  });
}
