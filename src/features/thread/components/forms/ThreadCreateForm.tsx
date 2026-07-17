import type { UpfileStateFlags } from "@nijiurachan/js/pure";
import { Scope, useEventLatest } from "@nijiurachan/js/react/PreactWrapperV1";
import { useState } from "react";
import { FiCheck } from "react-icons/fi";
import { UpfileInput } from "@/features/otegaki-upfile/components";
import { getAttachedFile } from "@/features/otegaki-upfile/lib/attachUpfileImage";
import { useSubmitPost } from "@/features/post/hooks/useSubmitPost";
import { useSettingsStore } from "@/features/settings/hooks";
import { Button, Checkbox, Textarea } from "@/shared/ui/form";
import { PostNotice } from "@/shared/ui/navigation";

interface Props {
  onSuccess?: () => void;
}

const SCOPE_NAME = "thread-create-form";
const UPFILE_FULL_KEY = `${SCOPE_NAME}:upfile`;

const selectIsPaintPopupOpen = (state: UpfileStateFlags): boolean =>
  state.isAxnosOpen || state.isKlecksOpen;

export const ThreadCreateForm: React.FunctionComponent<Props> = ({
  onSuccess,
}: Props) => {
  const deleteKey = useSettingsStore((state) => state.deleteKey);
  const [body, setBody] = useState("");
  const [r18, setR18] = useState(false);
  const [allowImageReplies, setAllowImageReplies] = useState(true);
  const [showSuccess, setShowSuccess] = useState(false);
  const isPaintPopupOpen =
    useEventLatest(
      UPFILE_FULL_KEY,
      "aimg:upfile-state",
      selectIsPaintPopupOpen,
    ) ?? false;
  const { mutateAsync: submitPost, isPending } = useSubmitPost();

  const handleSubmit = async (
    event: React.SubmitEvent<HTMLFormElement>,
  ): Promise<void> => {
    event.preventDefault();
    if (isPending || isPaintPopupOpen || !body.trim()) return;

    const form = event.currentTarget;
    const prepareEvent = new CustomEvent("aimg:prepare-submit", {
      detail: {} as { preparing?: Promise<void> },
    });
    form.dispatchEvent(prepareEvent);
    await prepareEvent.detail.preparing;

    try {
      await submitPost({
        mode: "thread",
        body: body.trim(),
        deleteKey,
        file: getAttachedFile(form),
        r18,
        allowImageReplies,
      });
      setShowSuccess(true);
      setBody("");
      setR18(false);
      setAllowImageReplies(true);
      window.setTimeout(() => {
        setShowSuccess(false);
        onSuccess?.();
      }, 200);
    } catch {
      // useSubmitPost displays the native API error.
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
          setBody(event.target.value)
        }
        placeholder="ｷﾀ━━━━(ﾟ∀ﾟ)━━━━!!"
        rows={6}
        required
      />
      <Scope name={SCOPE_NAME}>
        <UpfileInput fullKey={UPFILE_FULL_KEY} allowImage />
      </Scope>
      <Checkbox checked={r18} onChange={setR18} label="R18スレッド" />
      <p className="text-xs text-muted-foreground">
        R18を指定したスレッドにはR18タグが付き、画像は初期状態でぼかして表示されます。
      </p>
      <Checkbox
        checked={allowImageReplies}
        onChange={setAllowImageReplies}
        label="画像レスを許可"
      />
      <Button
        type="submit"
        variant="primary"
        disabled={isPending || isPaintPopupOpen || !body.trim()}
        className="w-full py-4 text-lg font-medium"
      >
        {isPending ? "書き込み中..." : "スレッドを立てる"}
      </Button>
      <PostNotice />
    </form>
  );
};
