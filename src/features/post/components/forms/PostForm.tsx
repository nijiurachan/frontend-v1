import type { UpfileStateFlags } from "@nijiurachan/js/pure";
import { Scope, useEventLatest } from "@nijiurachan/js/react/PreactWrapperV1";
import { useEffect, useState } from "react";
import { FiCheck } from "react-icons/fi";
import { UpfileInput } from "@/features/otegaki-upfile/components";
import { attachUpfileImage } from "@/features/otegaki-upfile/lib/attachUpfileImage";
import { useSettingsStore } from "@/features/settings/hooks";
import {
  useResolveTurnstileToken,
  useTurnstileOnPostSuccess,
} from "@/features/turnstile/hooks";
import { getFingerprint } from "@/shared/lib";
import { Button, Input, Textarea } from "@/shared/ui/form";
import { PostNotice } from "@/shared/ui/navigation";
import { ConfirmDialog } from "@/shared/ui/overlay";
import type { CloseReason } from "@/shared/ui/overlay/ConfirmDialog";
import { useSubmitPost } from "../../hooks/useSubmitPost";

interface PostFormData {
  act: string;
  comment: string;
}

interface Props {
  threadId: number;
  allowImage: boolean;
  initialComment?: string;
  openCount?: number;
  isArchived?: boolean;
  onSuccess?: () => void;
}

const SCOPE_NAME = "post-form";
const UPFILE_ID = "upfile";
const UPFILE_FULL_KEY = `${SCOPE_NAME}:${UPFILE_ID}`;

const selectIsPaintPopupOpen = (s: UpfileStateFlags): boolean =>
  s.isAxnosOpen || s.isKlecksOpen;

export const PostForm: React.FunctionComponent<Props> = ({
  threadId,
  allowImage,
  initialComment = "",
  openCount,
  isArchived = false,
  onSuccess,
}: Props) => {
  const deleteKey = useSettingsStore((s) => s.deleteKey);
  const [formData, setFormData] = useState<PostFormData>({
    act: "",
    comment: initialComment,
  });
  const [showSuccess, setShowSuccess] = useState(false);
  const [quoteDialogOpen, setQuoteDialogOpen] = useState(false);
  const [pendingQuote, setPendingQuote] = useState("");
  const [isPreparingSubmit, setIsPreparingSubmit] = useState(false);

  const isPaintPopupOpen =
    useEventLatest(
      UPFILE_FULL_KEY,
      "aimg:upfile-state",
      selectIsPaintPopupOpen,
    ) ?? false;

  // biome-ignore lint: initialComment取り込みはシートが開いたときに行う
  useEffect(() => {
    if (!initialComment) return;

    const currentComment = formData.comment;
    if (!currentComment.trim()) {
      setFormData((prev) => ({ ...prev, comment: initialComment }));
      return;
    }

    setPendingQuote(initialComment);
    setQuoteDialogOpen(true);
  }, [openCount]);

  const handleQuotePrepend = (): void => {
    setFormData((prev) => ({
      ...prev,
      comment: `${pendingQuote}\n${prev.comment}`,
    }));
  };

  const handleQuoteAppend = (): void => {
    setFormData((prev) => ({
      ...prev,
      comment: `${prev.comment}\n${pendingQuote}`,
    }));
  };

  function handleQuoteConfirmDialogClose(reason: CloseReason): void {
    switch (reason) {
      case "pressed-cancel":
        handleQuoteAppend();
        break;
      case "pressed-confirm":
        handleQuotePrepend();
        break;
      default:
        break;
    }
    setQuoteDialogOpen(false);
  }

  const { mutateAsync: submitPost, isPending } = useSubmitPost();
  const resolveTurnstileToken = useResolveTurnstileToken("reply");
  const onTurnstileSuccess = useTurnstileOnPostSuccess();

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ): void => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (
    e: React.SubmitEvent<HTMLFormElement>,
  ): Promise<void> => {
    e.preventDefault();
    const form = e.currentTarget; // currentTargetはすぐ捕まえないとnullになってしまうので早めに確保。

    if (isArchived) {
      alert("このスレッドは落ちています。書き込みできません。");
      return;
    }

    // Enter / form.requestSubmit() で disabled を回避されてもガード。
    // prepare/fingerprint の非同期区間中は isPending がまだ立たないので
    // ローカルフラグで二重起動を防ぐ。同条件を <Button disabled={...}> にもミラー。
    if (isPreparingSubmit || isPending || isPaintPopupOpen) {
      return;
    }
    // submit 前に focus を外して IME 入力を確定させる
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }

    setIsPreparingSubmit(true);
    try {
      const token = await resolveTurnstileToken();
      if (token === null) return;

      const prepareEvent = new CustomEvent("aimg:prepare-submit", {
        detail: {} as { preparing?: Promise<void> },
      });
      form.dispatchEvent(prepareEvent);
      await prepareEvent.detail.preparing;

      const data = new FormData(form);
      attachUpfileImage(form, data);
      data.delete("act");
      data.set("email", formData.act);
      data.set("comment", formData.comment);
      data.set("password", deleteKey);
      data.set("thread_id", String(threadId));

      const fingerprint = await getFingerprint();
      data.set("fingerprint", fingerprint);

      data.set("cf-turnstile-response", token);

      await submitPost({ formData: data, mode: "reply" });
      form.dispatchEvent(new CustomEvent("aimg:submitted"));

      onTurnstileSuccess(token);

      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        setFormData({
          act: "",
          comment: "",
        });

        onSuccess?.();
      }, 200);
    } catch (err) {
      alert(err instanceof Error ? err.message : "投稿失敗");
    } finally {
      setIsPreparingSubmit(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4"
      data-turnstile-target-form="reply"
    >
      <div>
        <Input
          type="text"
          name="act"
          className="w-full"
          value={formData.act}
          onChange={handleChange}
          placeholder="例: sage ID表示"
        />
      </div>

      <div>
        <Textarea
          name="comment"
          value={formData.comment}
          onChange={handleChange}
          placeholder="ｷﾀ━━━━(ﾟ∀ﾟ)━━━━!!"
          rows={6}
        />
      </div>

      <Scope name={SCOPE_NAME}>
        <UpfileInput fullKey={UPFILE_FULL_KEY} allowImage={allowImage} />
      </Scope>

      <Button
        type="submit"
        variant="primary"
        disabled={isPreparingSubmit || isPending || isPaintPopupOpen}
        className="w-full py-4 text-lg font-medium"
      >
        {isPending ? "書き込み中..." : "返信"}
      </Button>

      <PostNotice />

      {showSuccess && (
        <div className="flex items-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg">
          <div className="w-6 h-6 flex items-center justify-center bg-white rounded-full">
            <FiCheck className="w-4 h-4 text-green-600" />
          </div>
          <span className="font-medium">成功しました！</span>
        </div>
      )}
      <ConfirmDialog
        isOpen={quoteDialogOpen}
        onClose={handleQuoteConfirmDialogClose}
        title="引用文の挿入位置"
        message="引用文をどちらに挿入しますか？"
        confirmText="先頭に追加"
        cancelText="末尾に追加"
      />
    </form>
  );
};
