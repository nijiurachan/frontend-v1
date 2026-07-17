import type { UpfileStateFlags } from "@nijiurachan/js/pure";
import { Scope, useEventLatest } from "@nijiurachan/js/react/PreactWrapperV1";
import { useEffect, useState } from "react";
import { FiCheck } from "react-icons/fi";
import { UpfileInput } from "@/features/otegaki-upfile/components";
import { getAttachedFile } from "@/features/otegaki-upfile/lib/attachUpfileImage";
import { useSettingsStore } from "@/features/settings/hooks";
import { Button, Textarea } from "@/shared/ui/form";
import { PostNotice } from "@/shared/ui/navigation";
import { ConfirmDialog } from "@/shared/ui/overlay";
import type { CloseReason } from "@/shared/ui/overlay/ConfirmDialog";
import { useSubmitPost } from "../../hooks/useSubmitPost";

interface PostFormData {
  comment: string;
}

interface Props {
  threadId: string;
  allowImage: boolean;
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
  allowImage,
  initialComment = "",
  openCount,
  isArchived = false,
  onSuccess,
}: Props) => {
  const deleteKey = useSettingsStore((state) => state.deleteKey);
  const [formData, setFormData] = useState<PostFormData>({
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

  // 投稿モーダルの openCount 変化時だけ、引用初期値を適用する。
  // biome-ignore lint/correctness/useExhaustiveDependencies: openCount はモーダル再表示を表す明示的なトリガー
  useEffect(() => {
    if (!initialComment) return;
    if (!formData.comment.trim()) {
      setFormData((prev) => ({ ...prev, comment: initialComment }));
      return;
    }
    setPendingQuote(initialComment);
    setQuoteDialogOpen(true);
  }, [openCount]);

  const { mutateAsync: submitPost, isPending } = useSubmitPost();

  const handleSubmit = async (
    event: React.SubmitEvent<HTMLFormElement>,
  ): Promise<void> => {
    event.preventDefault();
    const form = event.currentTarget;
    if (
      isArchived ||
      isPreparingSubmit ||
      isPending ||
      isPaintPopupOpen ||
      !formData.comment.trim()
    ) {
      if (isArchived) alert("このスレッドは過去ログ化されています。");
      return;
    }

    setIsPreparingSubmit(true);
    try {
      const prepareEvent = new CustomEvent("aimg:prepare-submit", {
        detail: {} as { preparing?: Promise<void> },
      });
      form.dispatchEvent(prepareEvent);
      await prepareEvent.detail.preparing;
      await submitPost({
        mode: "reply",
        threadId,
        body: formData.comment.trim(),
        deleteKey,
        file: allowImage ? getAttachedFile(form) : null,
      });
      setShowSuccess(true);
      setFormData({ comment: "" });
      window.setTimeout(() => {
        setShowSuccess(false);
        onSuccess?.();
      }, 200);
    } catch (error) {
      if (error instanceof Error) alert(error.message);
    } finally {
      setIsPreparingSubmit(false);
    }
  };

  const handleQuoteDialogClose = (reason: CloseReason): void => {
    setFormData((prev) => ({
      comment:
        reason === "pressed-confirm"
          ? `${pendingQuote}\n${prev.comment}`
          : `${prev.comment}\n${pendingQuote}`,
    }));
    setQuoteDialogOpen(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Textarea
        value={formData.comment}
        onChange={(event: React.ChangeEvent<HTMLTextAreaElement>): void =>
          setFormData({ comment: event.target.value })
        }
        placeholder="ｷﾀ━━━━(ﾟ∀ﾟ)━━━━!!"
        rows={6}
        required
      />
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
