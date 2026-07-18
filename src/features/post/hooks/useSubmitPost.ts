import {
  type UseMutationResult,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { usePostedHistoryStore } from "@/features/history/stores/postedHistoryStore";
import type { CreatePostResult } from "@/shared/api";
import { apiPost, getAltchaSolution, uploadAttachment } from "@/shared/api";
import { toast } from "@/shared/ui/toast";

interface SubmitParams {
  mode: "thread" | "reply";
  threadId?: string;
  body: string;
  deleteKey: string;
  file: File | null;
  r18?: boolean;
  allowImageReplies?: boolean;
  duration?: string;
}

export function useSubmitPost(): UseMutationResult<
  CreatePostResult,
  unknown,
  SubmitParams
> {
  const queryClient = useQueryClient();
  const addPosted = usePostedHistoryStore((state) => state.addPosted);

  return useMutation({
    mutationFn: async ({
      mode,
      threadId,
      body,
      deleteKey,
      file,
      r18 = false,
      allowImageReplies = true,
      duration = "",
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
        ...(mode === "thread" ? { r18, allowImageReplies, duration } : {}),
      };
      const path =
        mode === "thread" ? "/threads" : `/threads/${threadId}/posts`;
      return apiPost<CreatePostResult>(path, payload, { requiresToken: true });
    },
    onSuccess: (result: CreatePostResult, { mode }: SubmitParams): void => {
      addPosted(result.threadId);
      if (mode === "thread") {
        queryClient.invalidateQueries({ queryKey: ["threads"] });
      } else {
        queryClient.invalidateQueries({ queryKey: ["thread"] });
      }
    },
    onError: (error: unknown): void => {
      toast.error(
        error instanceof Error ? error.message : "投稿に失敗しました",
      );
    },
  });
}
