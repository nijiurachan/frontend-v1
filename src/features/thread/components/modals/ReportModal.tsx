import { useState } from "react";
import { ApiError } from "@/shared/api";
import { Button, Textarea } from "@/shared/ui/form";
import { Modal } from "@/shared/ui/overlay";
import { toast } from "@/shared/ui/toast";
import { useReportMutation } from "../../hooks/useReportMutation";

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  postId: number;
}

export const ReportModal: React.FunctionComponent<ReportModalProps> = ({
  isOpen,
  onClose,
  postId,
}: ReportModalProps) => {
  const [reason, setReason] = useState("");
  const { mutate: report, isPending } = useReportMutation();

  const handleClose = (): void => {
    setReason("");
    onClose();
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>): void => {
    event.preventDefault();

    const trimmedReason = reason.trim();
    if (!trimmedReason) {
      toast.error("通報理由を入力してください");
      return;
    }

    report(
      { postId, reason: trimmedReason },
      {
        onSuccess: (): void => {
          toast.success("通報を送信しました");
          handleClose();
        },
        onError: (error: unknown): void => {
          const message =
            error instanceof ApiError || error instanceof Error
              ? error.message
              : "通報の送信に失敗しました";
          toast.error(message);
        },
      },
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="通報" position="bottom">
      <form className="space-y-4 p-4" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <label
            className="text-sm font-medium text-foreground"
            htmlFor="report-reason"
          >
            通報理由
          </label>
          <Textarea
            id="report-reason"
            value={reason}
            onChange={(event: React.ChangeEvent<HTMLTextAreaElement>): void =>
              setReason(event.target.value)
            }
            placeholder="通報理由を入力してください"
            rows={4}
            required
            disabled={isPending}
          />
        </div>
        <div className="flex gap-3">
          <Button
            type="button"
            variant="default"
            className="flex-1"
            onClick={handleClose}
            disabled={isPending}
          >
            キャンセル
          </Button>
          <Button
            type="submit"
            variant="primary"
            className="flex-1"
            disabled={isPending}
          >
            {isPending ? "送信中..." : "送信"}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
