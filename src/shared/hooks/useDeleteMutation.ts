import {
  type UseMutationResult,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { apiPost } from "@/shared/api";

interface DeleteResponse {
  thread_deleted: boolean;
  post_deleted?: boolean;
  banned: boolean;
}

interface DeleteParams {
  password: string;
  threadId?: number;
  postId?: number;
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
      threadId,
      postId,
    }: DeleteParams): Promise<DeleteResponse> => {
      const formData = new FormData();
      formData.append("password", password);
      if (threadId != null) formData.append("thread_id", String(threadId));
      if (postId != null) formData.append("post_id", String(postId));

      return apiPost<DeleteResponse>("/delete", formData);
    },
    onSuccess: (data: DeleteResponse): void => {
      if (data.thread_deleted) {
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
