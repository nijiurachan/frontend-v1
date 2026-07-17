import {
  type UseMutationResult,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import type { CreatePostResult } from "@/shared/api";
import { apiPost, getAltchaSolution, uploadAttachment } from "@/shared/api";

interface SubmitParams {
  mode: "thread" | "reply";
  threadId?: string;
  body: string;
  deleteKey: string;
  file: File | null;
  r18?: boolean;
  allowImageReplies?: boolean;
}

export function useSubmitPost(): UseMutationResult<
  CreatePostResult,
  unknown,
  SubmitParams
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      mode,
      threadId,
      body,
      deleteKey,
      file,
      r18 = false,
      allowImageReplies = true,
    }: SubmitParams): Promise<CreatePostResult> => {
      if (mode === "reply" && !threadId) {
        throw new Error("スレッドIDがありません");
      }
      const attachmentId = file ? await uploadAttachment(file) : undefined;
      const altcha = await getAltchaSolution();
      const payload = {
        body,
        altcha,
        deleteKey,
        ...(attachmentId ? { attachmentId } : {}),
        ...(mode === "thread" ? { r18, allowImageReplies } : {}),
      };
      const path =
        mode === "thread" ? "/threads" : `/threads/${threadId}/posts`;
      return apiPost<CreatePostResult>(path, payload, { requiresToken: true });
    },
    onSuccess: (_result: CreatePostResult, { mode }: SubmitParams): void => {
      if (mode === "thread") {
        queryClient.invalidateQueries({ queryKey: ["threads"] });
      } else {
        queryClient.invalidateQueries({ queryKey: ["thread"] });
      }
    },
    onError: (error: unknown): void => {
      alert(error instanceof Error ? error.message : "投稿に失敗しました");
    },
  });
}
