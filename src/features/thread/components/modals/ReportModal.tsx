import { useState } from "react";
import { Button, Textarea } from "@/shared/ui/form";
import { Modal } from "@/shared/ui/overlay";
import { toast } from "@/shared/ui/toast";
import {
  type ReportReason,
  useReportMutation,
} from "../../hooks/useReportMutation";

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  postId: string;
}

const REPORT_REASONS: ReadonlyArray<{ value: ReportReason; label: string }> = [
  { value: "spam", label: "スパム" },
  { value: "illegal", label: "違法・権利侵害" },
  { value: "nsfw_violation", label: "NSFW違反" },
  { value: "other", label: "その他" },
];

export const ReportModal: React.FunctionComponent<ReportModalProps> = ({
  isOpen,
  onClose,
  postId,
}: ReportModalProps) => {
  const [reason, setReason] = useState<ReportReason | "">("");
  const [detail, setDetail] = useState("");
  const { mutate: report, isPending } = useReportMutation();

  const handleClose = (): void => {
    setReason("");
    setDetail("");
    onClose();
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    if (!reason) {
      toast.error("通報理由を選択してください");
      return;
    }

    report(
      {
        postId,
        reason,
        ...(detail.trim() ? { detail: detail.trim() } : {}),
      },
      {
        onSuccess: (): void => {
          toast.success("通報を送信しました");
          handleClose();
        },
        onError: (error: unknown): void => {
          toast.error(
            error instanceof Error ? error.message : "通報の送信に失敗しました",
          );
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
          <select
            id="report-reason"
            value={reason}
            onChange={(event: React.ChangeEvent<HTMLSelectElement>): void =>
              setReason(event.target.value as ReportReason | "")
            }
            disabled={isPending}
            required
            className="w-full rounded-lg border border-border bg-card px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">理由を選択してください</option>
            {REPORT_REASONS.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <label
            className="text-sm font-medium text-foreground"
            htmlFor="report-detail"
          >
            詳細（任意）
          </label>
          <Textarea
            id="report-detail"
            value={detail}
            onChange={(event: React.ChangeEvent<HTMLTextAreaElement>): void =>
              setDetail(event.target.value)
            }
            placeholder="補足があれば入力してください"
            rows={4}
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
            disabled={isPending || !reason}
          >
            {isPending ? "送信中..." : "送信"}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
