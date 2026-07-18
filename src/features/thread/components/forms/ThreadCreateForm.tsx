import type { UpfileStateFlags } from "@nijiurachan/js/pure";
import { Scope, useEventLatest } from "@nijiurachan/js/react/PreactWrapperV1";
import { useRouter } from "@tanstack/react-router";
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
import { getCreatedThreadRoute } from "@/features/post/components/forms/createdThreadRoute";
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
import { useSettingsStore } from "@/features/settings/hooks";
import { useThreadLimits } from "@/features/thread/hooks/useThreadLimits";
import {
  clearThreadCreateDraft,
  readThreadCreateDraft,
  saveThreadCreateDraft,
} from "@/features/thread/stores/threadCreateDraftStore";
import { prepareThreadCreateAttachment } from "@/features/thread/utils/threadCreateSubmission";
import {
  threadDurationHint,
  validateThreadDuration,
} from "@/features/thread/utils/threadExpiry";
import { getApiErrorMessage } from "@/shared/ui/feedback/apiErrorMessage";
import { Button, Checkbox, Input, Textarea } from "@/shared/ui/form";
import { OnlineUsersIndicator, PostNotice } from "@/shared/ui/navigation";
import { toast } from "@/shared/ui/toast";

interface Props {
  onSuccess?: () => void;
  active?: boolean;
}

const SCOPE_NAME = "thread-create-form";
const UPFILE_FULL_KEY = `${SCOPE_NAME}:upfile`;

const selectIsPaintPopupOpen = (state: UpfileStateFlags): boolean =>
  state.isAxnosOpen || state.isKlecksOpen;
const selectHasSelectedFile = (state: UpfileStateFlags): boolean =>
  state.hasSelectedFile;

export const ThreadCreateForm: React.FunctionComponent<Props> = ({
  onSuccess,
  active = true,
}: Props) => {
  const router = useRouter();
  const deleteKey = useSettingsStore((state) => state.deleteKey);
  const [body, setBody] = useState(readThreadCreateDraft);
  const updateBody = useCallback((nextBody: string): void => {
    setBody(nextBody);
    saveThreadCreateDraft(nextBody);
  }, []);
  const [r18, setR18] = useState(false);
  const [allowImageReplies, setAllowImageReplies] = useState(true);
  const [duration, setDuration] = useState("");
  const [submissionUi, dispatchSubmissionUi] = useReducer(
    submissionUiReducer,
    undefined,
    createSubmissionUiState,
  );
  const [submissionLock] = useState(createSubmissionLock);
  const [submissionLifecycle] = useState(createSubmissionLifecycle);
  const altchaRef = useRef<AltchaWidgetHandle>(null);
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
  const { mutateAsync: submitPost, isPending } = useSubmitPost();
  const { data: threadLimits, isError: isThreadLimitsError } =
    useThreadLimits();
  const durationError = threadLimits
    ? validateThreadDuration(
        duration,
        threadLimits.durationHours,
        threadLimits.minimumMinutes,
      )
    : null;
  const isSubmitting = isSubmissionInProgress(submissionUi, isPending);
  const { showSuccess, submitError } = submissionUi;

  useEffect(() => {
    return (): void => submissionLifecycle.invalidate();
  }, [submissionLifecycle]);

  useEffect(() => {
    if (!active) {
      submissionLifecycle.invalidate();
      altchaRef.current?.reset();
      submissionLock.release();
      // Closing a persistent form must make the next open immediately usable.
      dispatchSubmissionUi({ type: "reset" });
    }
  }, [active, submissionLifecycle, submissionLock]);

  const handleSubmit = async (
    event: React.SubmitEvent<HTMLFormElement>,
  ): Promise<void> => {
    event.preventDefault();
    if (
      !active ||
      submissionLock.isLocked() ||
      isPaintPopupOpen ||
      !hasPostContent(body, hasSelectedFile) ||
      body.length > POST_BODY_MAX_LENGTH ||
      durationError !== null
    ) {
      return;
    }
    if (!submissionLock.acquire()) return;
    const signal = submissionLifecycle.begin();
    dispatchSubmissionUi({ type: "start" });

    const form = event.currentTarget;
    let file: File;
    try {
      file = await prepareThreadCreateAttachment(form, getAttachedFile);
      if (!submissionLifecycle.isCurrent(signal)) return;
    } catch (error) {
      if (!submissionLifecycle.isCurrent(signal)) return;
      toast.error(
        error instanceof Error ? error.message : "画像の準備に失敗しました",
      );
      dispatchSubmissionUi({
        type: "failure",
        message: getApiErrorMessage(error, "画像の準備に失敗しました"),
      });
      submissionLock.release();
      dispatchSubmissionUi({ type: "finish" });
      return;
    }

    try {
      const altcha = altchaRef.current;
      if (!altcha) throw new Error("書き込み認証を読み込んでいます");
      const result = await submitPost({
        mode: "thread",
        body: body.trim(),
        deleteKey,
        file,
        r18,
        allowImageReplies,
        duration,
        altcha,
        signal,
      });
      if (!submissionLifecycle.isCurrent(signal)) return;
      notifyUpfileSubmitted(form);
      dispatchSubmissionUi({ type: "success" });
      clearThreadCreateDraft();
      setBody("");
      setR18(false);
      setAllowImageReplies(true);
      setDuration("");
      onSuccess?.();
      void router.navigate(getCreatedThreadRoute(result.threadId));
    } catch (error) {
      if (!submissionLifecycle.isCurrent(signal)) return;
      // useSubmitPost displays the native API error.
      dispatchSubmissionUi({
        type: "failure",
        message: getApiErrorMessage(error, "スレッド作成に失敗しました"),
      });
    } finally {
      if (submissionLifecycle.isCurrent(signal)) {
        submissionLock.release();
        dispatchSubmissionUi({ type: "finish" });
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {showSuccess && (
        <div className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-3 text-white">
          <FiCheck className="h-4 w-4" />
          <span className="font-medium">成功しました！</span>
        </div>
      )}
      <Textarea
        value={body}
        onChange={(event: React.ChangeEvent<HTMLTextAreaElement>): void =>
          updateBody(event.target.value)
        }
        placeholder="ｷﾀ━━━━(ﾟ∀ﾟ)━━━━!!"
        rows={6}
        maxLength={POST_BODY_MAX_LENGTH}
        aria-describedby="thread-body-counter"
      />
      <p
        id="thread-body-counter"
        className="text-right text-xs text-muted-foreground"
      >
        {formatPostBodyLength(body.length)}
      </p>
      <Scope name={SCOPE_NAME}>
        <UpfileInput fullKey={UPFILE_FULL_KEY} allowImage />
      </Scope>
      <AltchaWidget operation="thread" ref={altchaRef} />
      <Checkbox checked={r18} onChange={setR18} label="R18スレッド" />
      <p className="text-xs text-muted-foreground">
        R18を指定したスレッドにはR18タグが付き、画像は初期状態でぼかして表示されます。
      </p>
      <Checkbox
        checked={allowImageReplies}
        onChange={setAllowImageReplies}
        label="画像レスを許可"
      />
      <div className="space-y-1">
        <label htmlFor="thread-duration" className="block text-sm font-medium">
          保持期間
        </label>
        <Input
          id="thread-duration"
          name="duration"
          value={duration}
          onChange={(event: React.ChangeEvent<HTMLInputElement>): void =>
            setDuration(event.target.value)
          }
          placeholder="H:M（空欄は現在の上限）"
          inputMode="text"
          autoComplete="off"
          aria-describedby={`thread-duration-hint${durationError ? " thread-duration-error" : ""}`}
          aria-invalid={durationError !== null}
          error={durationError !== null}
        />
        <p id="thread-duration-hint" className="text-xs text-muted-foreground">
          {threadLimits
            ? threadDurationHint(threadLimits)
            : isThreadLimitsError
              ? "上限の取得に失敗しました。送信時にサーバーで検証します。"
              : "現在の保持期間上限を取得中です…"}
        </p>
        {durationError && (
          <p
            id="thread-duration-error"
            className="text-xs text-destructive"
            role="alert"
          >
            {durationError}
          </p>
        )}
      </div>
      <OnlineUsersIndicator className="block text-center text-xs text-muted-foreground" />
      <Button
        type="submit"
        variant="primary"
        disabled={
          isSubmitting ||
          isPaintPopupOpen ||
          !hasPostContent(body, hasSelectedFile) ||
          body.length > POST_BODY_MAX_LENGTH ||
          durationError !== null
        }
        className="w-full py-4 text-lg font-medium"
      >
        {isSubmitting ? "書き込み中..." : "スレッドを立てる"}
      </Button>
      {submitError && (
        <p className="text-sm text-destructive" role="alert">
          {submitError}
        </p>
      )}
      <PostNotice />
    </form>
  );
};
