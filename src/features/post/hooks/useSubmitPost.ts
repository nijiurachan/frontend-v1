import {
  type UseMutationResult,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { usePostedHistoryStore } from "@/features/history/stores/postedHistoryStore";
import { notifySubmitError } from "@/features/post/lib/submitPostErrorNotification";
import type {
  AltchaCredentialProvider,
  SubmitPostFlowDependencies,
} from "@/features/post/lib/submitPostFlow";
import {
  type SubmitPostInput,
  submitPostFlow,
} from "@/features/post/lib/submitPostFlow";
import type { CreatePostResult } from "@/shared/api";
import { apiPost, refreshAimgToken, uploadAttachment } from "@/shared/api";
import { toast } from "@/shared/ui/toast";

type SubmitParams = SubmitPostInput & {
  altcha: AltchaCredentialProvider;
};

const SUBMIT_DEPENDENCIES: SubmitPostFlowDependencies = {
  uploadAttachment,
  post: (
    path: string,
    body: object,
    options: { token: string; signal?: AbortSignal },
  ): Promise<CreatePostResult> => apiPost(path, body, options),
  refreshToken: refreshAimgToken,
};

export function useSubmitPost(): UseMutationResult<
  CreatePostResult,
  unknown,
  SubmitParams
> {
  const queryClient = useQueryClient();
  const addPosted = usePostedHistoryStore((state) => state.addPosted);

  return useMutation({
    mutationFn: async ({ altcha, ...input }: SubmitParams) => {
      return submitPostFlow(input, altcha, SUBMIT_DEPENDENCIES);
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
      notifySubmitError(error, (message) => toast.error(message));
    },
  });
}
