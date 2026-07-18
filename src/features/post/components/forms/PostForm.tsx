import type { UpfileStateFlags } from "@nijiurachan/js/pure";
import { Scope, useEventLatest } from "@nijiurachan/js/react/PreactWrapperV1";
import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { FiCheck } from "react-icons/fi";
import { UpfileInput } from "@/features/otegaki-upfile/components";
import {
  getAttachedFile,
  notifyUpfileSubmitted,
} from "@/features/otegaki-upfile/lib/attachUpfileImage";
import {
  AltchaWidget,
  type AltchaWidgetHandle,
} from "@/features/post/components/AltchaWidget";
import {
  formatPostBodyLength,
  hasPostContent,
  POST_BODY_MAX_LENGTH,
} from "@/features/post/components/forms/postFormConfig";
import { createSubmissionLock } from "@/features/post/components/forms/submissionLock";
import { useSubmitPost } from "@/features/post/hooks/useSubmitPost";
import { createSubmissionLifecycle } from "@/features/post/lib/submissionLifecycle";
import {
  createSubmissionUiState,
  isSubmissionInProgress,
  submissionUiReducer,
} from "@/features/post/lib/submissionUiState";
import {
  clearReplyDraft,
  readReplyDraft,
  saveReplyDraft,
} from "@/features/post/stores/replyDraftStore";
import { useSettingsStore } from "@/features/settings/hooks";
import { getApiErrorMessage } from "@/shared/ui/feedback/apiErrorMessage";
import { Button, Textarea } from "@/shared/ui/form";
import { PostNotice } from "@/shared/ui/navigation";
import { OnlineUsersIndicator } from "@/shared/ui/navigation/OnlineUsersIndicator";
import { ConfirmDialog } from "@/shared/ui/overlay";
import type { CloseReason } from "@/shared/ui/overlay/ConfirmDialog";
import { toast } from "@/shared/ui/toast";

interface PostFormData {
  comment: string;
}

interface Props {
  threadId: string;
  active?: boolean;
  allowImageReplies?: boolean;
  closedAt?: string | null;
  initialComment?: string;
  openCount?: number;
  isArchived?: boolean;
  onSuccess?: () => void;
}

const SCOPE_NAME = "post-form";
const UPFILE_FULL_KEY = `${SCOPE_NAME}:upfile`;

const selectIsPaintPopupOpen = (state: UpfileStateFlags): boolean =>
  state.isAxnosOpen || state.isKlecksOpen;
const selectHasSelectedFile = (state: UpfileStateFlags): boolean =>
  state.hasSelectedFile;

export const PostForm: React.FunctionComponent<Props> = ({
  threadId,
  active = true,
  allowImageReplies = true,
  closedAt = null,
  initialComment = "",
  openCount,
  isArchived = false,
  onSuccess,
}: Props) => {
  const deleteKey = useSettingsStore((state) => state.deleteKey);
  const [formData, setFormData] = useState<PostFormData>(() => ({
    comment: readReplyDraft(threadId),
  }));
  const formDataRef = useRef<PostFormData>(formData);
  const updateFormData = useCallback(
    (
      update: PostFormData | ((previous: PostFormData) => PostFormData),
    ): void => {
      const next =
        typeof update === "function" ? update(formDataRef.current) : update;
      formDataRef.current = next;
      setFormData(next);
      saveReplyDraft(threadId, next.comment);
    },
    [threadId],
  );
  const [quoteDialogOpen, setQuoteDialogOpen] = useState(false);
  const [pendingQuote, setPendingQuote] = useState("");
  const [submissionUi, dispatchSubmissionUi] = useReducer(
    submissionUiReducer,
    undefined,
    createSubmissionUiState,
  );
  const [submissionLock] = useState(createSubmissionLock);
  const [submissionLifecycle] = useState(createSubmissionLifecycle);
  const altchaRef = useRef<AltchaWidgetHandle>(null);
  const successTimerRef = useRef<number | null>(null);
  const clearSuccessTimer = useCallback((): void => {
    if (successTimerRef.current === null) return;
    window.clearTimeout(successTimerRef.current);
    successTimerRef.current = null;
  }, []);
  const isPaintPopupOpen =
    useEventLatest(
      UPFILE_FULL_KEY,
      "aimg:upfile-state",
      selectIsPaintPopupOpen,
    ) ?? false;
  const hasSelectedFile =
    useEventLatest(
      UPFILE_FULL_KEY,
      "aimg:upfile-state",
      selectHasSelectedFile,
    ) ?? false;

  useEffect(() => {
    submissionLifecycle.invalidate();
    submissionLock.release();
    altchaRef.current?.reset();
    clearSuccessTimer();
    dispatchSubmissionUi({ type: "reset" });
    const nextFormData = { comment: readReplyDraft(threadId) };
    formDataRef.current = nextFormData;
    // threadId is an external identity boundary; switch the controlled value
    // before this form can submit under the new thread.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFormData(nextFormData);
  }, [clearSuccessTimer, submissionLifecycle, submissionLock, threadId]);

  useEffect(() => {
    return (): void => {
      submissionLifecycle.invalidate();
      clearSuccessTimer();
    };
  }, [clearSuccessTimer, submissionLifecycle]);

  useEffect(() => {
    if (!active) {
      submissionLifecycle.invalidate();
      altchaRef.current?.reset();
      submissionLock.release();
      clearSuccessTimer();
      // Closing a persistent form must make the next open immediately usable.
      dispatchSubmissionUi({ type: "reset" });
    }
  }, [active, clearSuccessTimer, submissionLifecycle, submissionLock]);

  // 投稿モーダルの openCount 変化時だけ、引用初期値を適用する。
  // biome-ignore lint/correctness/useExhaustiveDependencies: openCountはモーダル再表示を表す明示的なトリガー
  useEffect(() => {
    if (!initialComment) return;
    queueMicrotask(() => {
      if (!formDataRef.current.comment.trim()) {
        updateFormData((prev) => ({ ...prev, comment: initialComment }));
        return;
      }
      setPendingQuote(initialComment);
      setQuoteDialogOpen(true);
    });
  }, [initialComment, openCount, updateFormData]);

  const { mutateAsync: submitPost, isPending } = useSubmitPost();
  const isSubmitting = isSubmissionInProgress(submissionUi, isPending);
  const { showSuccess, submitError } = submissionUi;

  const handleSubmit = async (
    event: React.SubmitEvent<HTMLFormElement>,
  ): Promise<void> => {
    event.preventDefault();
    const form = event.currentTarget;
    if (
      !active ||
      isArchived ||
      closedAt ||
      submissionLock.isLocked() ||
      isPaintPopupOpen ||
      !hasPostContent(formData.comment, hasSelectedFile) ||
      formData.comment.length > POST_BODY_MAX_LENGTH
    ) {
      if (isArchived) alert("このスレッドは過去ログ化されています。");
      return;
    }
    if (!submissionLock.acquire()) return;

    const signal = submissionLifecycle.begin();
    dispatchSubmissionUi({ type: "start" });
    let mutationStarted = false;
    try {
      const prepareEvent = new CustomEvent("aimg:prepare-submit", {
        detail: {} as { preparing?: Promise<void> },
      });
      form.dispatchEvent(prepareEvent);
      await prepareEvent.detail.preparing;
      if (!submissionLifecycle.isCurrent(signal)) return;
      const file = allowImageReplies ? getAttachedFile(form) : null;
      if (!hasPostContent(formData.comment, file !== null)) return;
      const altcha = altchaRef.current;
      if (!altcha) throw new Error("書き込み認証を読み込んでいます");
      mutationStarted = true;
      await submitPost({
        mode: "reply",
        threadId,
        body: formData.comment.trim(),
        deleteKey,
        file,
        altcha,
        signal,
      });
      if (!submissionLifecycle.isCurrent(signal)) return;
      notifyUpfileSubmitted(form);
      dispatchSubmissionUi({ type: "success" });
      clearReplyDraft(threadId);
      updateFormData({ comment: "" });
      clearSuccessTimer();
      successTimerRef.current = window.setTimeout(() => {
        successTimerRef.current = null;
        if (submissionLifecycle.isCurrent(signal)) {
          dispatchSubmissionUi({ type: "hide-success" });
          onSuccess?.();
        }
      }, 200);
    } catch (error) {
      if (!submissionLifecycle.isCurrent(signal)) return;
      const message = getApiErrorMessage(error, "投稿に失敗しました");
      dispatchSubmissionUi({ type: "failure", message });
      if (!mutationStarted) toast.error(message);
    } finally {
      if (submissionLifecycle.isCurrent(signal)) {
        submissionLock.release();
        dispatchSubmissionUi({ type: "finish" });
      }
    }
  };

  const handleQuoteDialogClose = (reason: CloseReason): void => {
    updateFormData((prev) => ({
      comment:
        reason === "pressed-confirm"
          ? `${pendingQuote}\n${prev.comment}`
          : `${prev.comment}\n${pendingQuote}`,
    }));
    setQuoteDialogOpen(false);
  };

  if (closedAt) {
    return (
      <output className="rounded-lg border border-border bg-muted px-4 py-5 text-center text-muted-foreground">
        このスレッドは閉鎖されています。返信できません。
      </output>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Textarea
        value={formData.comment}
        onChange={(event: React.ChangeEvent<HTMLTextAreaElement>): void =>
          updateFormData({ comment: event.target.value })
        }
        placeholder="ｷﾀ━━━━(ﾟ∀ﾟ)━━━━!!"
        rows={6}
        maxLength={POST_BODY_MAX_LENGTH}
        aria-describedby="post-comment-counter"
      />
      <p
        id="post-comment-counter"
        className="text-right text-xs text-muted-foreground"
      >
        {formatPostBodyLength(formData.comment.length)}
      </p>
      <Scope name={SCOPE_NAME}>
        <UpfileInput fullKey={UPFILE_FULL_KEY} allowImage={allowImageReplies} />
      </Scope>
      <AltchaWidget operation="reply" key={threadId} ref={altchaRef} />
      <OnlineUsersIndicator className="block text-center text-xs text-muted-foreground" />
      <Button
        type="submit"
        variant="primary"
        disabled={
          isSubmitting ||
          isPaintPopupOpen ||
          !hasPostContent(formData.comment, hasSelectedFile) ||
          formData.comment.length > POST_BODY_MAX_LENGTH
        }
        className="w-full py-4 text-lg font-medium"
      >
        {isSubmitting ? "書き込み中..." : "返信"}
      </Button>
      {submitError && (
        <p className="text-sm text-destructive" role="alert">
          {submitError}
        </p>
      )}
      <PostNotice />
      {showSuccess && (
        <div className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-3 text-white">
          <FiCheck className="h-4 w-4" />
          <span className="font-medium">成功しました！</span>
        </div>
      )}
      <ConfirmDialog
        isOpen={quoteDialogOpen}
        onClose={handleQuoteDialogClose}
        title="引用文の挿入位置"
        message="引用文をどちらに挿入しますか？"
        confirmText="先頭に追加"
        cancelText="末尾に追加"
      />
    </form>
  );
};
