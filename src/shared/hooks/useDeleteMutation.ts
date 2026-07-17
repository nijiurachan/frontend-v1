import {
  type UseMutationResult,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { apiDelete } from "@/shared/api";

interface DeleteResponse {
  postId: string;
  threadDeleted: boolean;
}

interface DeleteParams {
  password: string;
  threadId?: string;
  postId?: string;
}

export function useDeleteMutation(): UseMutationResult<
  DeleteResponse,
  unknown,
  DeleteParams
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      password,
      postId,
    }: DeleteParams): Promise<DeleteResponse> => {
      if (postId == null) throw new Error("削除対象が指定されていません");
      return apiDelete<DeleteResponse>(
        `/posts/${postId}`,
        { deleteKey: password },
        { requiresToken: true },
      );
    },
    onSuccess: (data: DeleteResponse): void => {
      if (data.threadDeleted) {
        queryClient.invalidateQueries({ queryKey: ["threads"] });
        alert("スレッドを削除しました");
      } else {
        queryClient.invalidateQueries({ queryKey: ["thread"] });
        alert("レスを削除しました");
      }
    },
    onError: (error: unknown): void => {
      alert(error instanceof Error ? error.message : "削除に失敗しました");
    },
  });
}
