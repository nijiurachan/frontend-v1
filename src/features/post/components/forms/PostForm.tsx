import type { UpfileStateFlags } from "@nijiurachan/js/pure";
import { Scope, useEventLatest } from "@nijiurachan/js/react/PreactWrapperV1";
import { useCallback, useEffect, useRef, useState } from "react";
import { FiCheck } from "react-icons/fi";
import { UpfileInput } from "@/features/otegaki-upfile/components";
import { getAttachedFile } from "@/features/otegaki-upfile/lib/attachUpfileImage";
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
import { useSubmitPost } from "../../hooks/useSubmitPost";
import { formatPostBodyLength, POST_BODY_MAX_LENGTH } from "./postFormConfig";
import { createSubmissionLock } from "./submissionLock";

interface PostFormData {
  comment: string;
}

interface Props {
  threadId: string;
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

export const PostForm: React.FunctionComponent<Props> = ({
  threadId,
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
  const [showSuccess, setShowSuccess] = useState(false);
  const [quoteDialogOpen, setQuoteDialogOpen] = useState(false);
  const [pendingQuote, setPendingQuote] = useState("");
  const [isPreparingSubmit, setIsPreparingSubmit] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const submissionLock = useRef(createSubmissionLock()).current;
  const isPaintPopupOpen =
    useEventLatest(
      UPFILE_FULL_KEY,
      "aimg:upfile-state",
      selectIsPaintPopupOpen,
    ) ?? false;

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
  const isSubmitting = isPreparingSubmit || isPending;

  const handleSubmit = async (
    event: React.SubmitEvent<HTMLFormElement>,
  ): Promise<void> => {
    event.preventDefault();
    const form = event.currentTarget;
    if (
      isArchived ||
      closedAt ||
      submissionLock.isLocked() ||
      isPaintPopupOpen ||
      !formData.comment.trim() ||
      formData.comment.length > POST_BODY_MAX_LENGTH
    ) {
      if (isArchived) alert("このスレッドは過去ログ化されています。");
      return;
    }
    if (!submissionLock.acquire()) return;

    setSubmitError(null);
    setIsPreparingSubmit(true);
    let mutationStarted = false;
    try {
      const prepareEvent = new CustomEvent("aimg:prepare-submit", {
        detail: {} as { preparing?: Promise<void> },
      });
      form.dispatchEvent(prepareEvent);
      await prepareEvent.detail.preparing;
      const file = allowImageReplies ? getAttachedFile(form) : null;
      mutationStarted = true;
      await submitPost({
        mode: "reply",
        threadId,
        body: formData.comment.trim(),
        deleteKey,
        file,
      });
      setShowSuccess(true);
      clearReplyDraft(threadId);
      updateFormData({ comment: "" });
      window.setTimeout(() => {
        setShowSuccess(false);
        onSuccess?.();
      }, 200);
    } catch (error) {
      const message = getApiErrorMessage(error, "投稿に失敗しました");
      setSubmitError(message);
      if (!mutationStarted) toast.error(message);
    } finally {
      submissionLock.release();
      setIsPreparingSubmit(false);
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
        required
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
      <OnlineUsersIndicator className="block text-center text-xs text-muted-foreground" />
      <Button
        type="submit"
        variant="primary"
        disabled={
          isSubmitting ||
          isPaintPopupOpen ||
          !formData.comment.trim() ||
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
