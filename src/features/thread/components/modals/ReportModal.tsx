import { useId, useState } from "react";
import { ApiError } from "@/shared/api";
import { Button, Input, Textarea } from "@/shared/ui/form";
import { Modal } from "@/shared/ui/overlay";
import { toast } from "@/shared/ui/toast";
import {
  type ReportReason,
  useReportMutation,
} from "../../hooks/useReportMutation";
import {
  getReportWholeThreadRange,
  REPORT_RANGE_LIMIT,
  type ReportSeq,
  validateReportRange,
} from "../../utils/reportValidation";

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  threadId: string;
  postSeq: number;
  maxSeq: number;
}

const REPORT_REASONS: ReadonlyArray<{ value: ReportReason; label: string }> = [
  { value: "spam", label: "スパム" },
  { value: "illegal", label: "違法・権利侵害" },
  { value: "nsfw_violation", label: "NSFW違反" },
  { value: "other", label: "その他" },
];

function getReportErrorMessage(error: unknown): string {
  if (error instanceof ApiError && error.status === 409) {
    return "同じ範囲の通報が処理中です";
  }
  if (error instanceof Error && error.message) return error.message;
  return "通報の送信に失敗しました";
}

export const ReportModal: React.FunctionComponent<ReportModalProps> = ({
  isOpen,
  onClose,
  threadId,
  postSeq,
  maxSeq,
}: ReportModalProps) => {
  const formId = useId();
  const defaultSeq = Math.max(0, Math.floor(postSeq));
  const lastSeq = Math.max(defaultSeq, Math.floor(maxSeq));
  const wholeThreadRange = getReportWholeThreadRange(lastSeq);
  const [fromSeq, setFromSeq] = useState<ReportSeq>(defaultSeq);
  const [toSeq, setToSeq] = useState<ReportSeq>(defaultSeq);
  const [reason, setReason] = useState<ReportReason | "">("");
  const [detail, setDetail] = useState("");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const { mutate: report, isPending } = useReportMutation();

  const handleClose = (): void => {
    setFromSeq(defaultSeq);
    setToSeq(defaultSeq);
    setReason("");
    setDetail("");
    setSubmitError(null);
    onClose();
  };

  const handleWholeThread = (): void => {
    setFromSeq(wholeThreadRange.fromSeq);
    setToSeq(wholeThreadRange.toSeq);
    setSubmitError(null);
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    const rangeError = validateReportRange(fromSeq, toSeq);
    if (rangeError) {
      setSubmitError(rangeError);
      return;
    }
    if (!reason) {
      setSubmitError("通報理由を選択してください");
      return;
    }
    if (typeof fromSeq !== "number" || typeof toSeq !== "number") return;

    setSubmitError(null);
    report(
      {
        threadId,
        fromSeq,
        toSeq,
        reason,
        ...(detail.trim() ? { detail: detail.trim() } : {}),
      },
      {
        onSuccess: (): void => {
          toast.success("通報を送信しました");
          handleClose();
        },
        onError: (error: unknown): void => {
          setSubmitError(getReportErrorMessage(error));
        },
      },
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="通報" position="bottom">
      <form className="space-y-4 p-4" onSubmit={handleSubmit}>
        <fieldset className="space-y-2">
          <legend className="text-sm font-medium text-foreground">
            対象範囲
          </legend>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label
                className="text-xs text-muted-foreground"
                htmlFor={`${formId}-from`}
              >
                from レス番号
              </label>
              <Input
                id={`${formId}-from`}
                type="number"
                min={0}
                max={lastSeq}
                value={fromSeq}
                onChange={(
                  event: React.ChangeEvent<HTMLInputElement>,
                ): void => {
                  setFromSeq(
                    event.target.value === "" ? "" : Number(event.target.value),
                  );
                  setSubmitError(null);
                }}
                disabled={isPending}
                required
              />
            </div>
            <div className="space-y-1">
              <label
                className="text-xs text-muted-foreground"
                htmlFor={`${formId}-to`}
              >
                to レス番号
              </label>
              <Input
                id={`${formId}-to`}
                type="number"
                min={0}
                max={lastSeq}
                value={toSeq}
                onChange={(
                  event: React.ChangeEvent<HTMLInputElement>,
                ): void => {
                  setToSeq(
                    event.target.value === "" ? "" : Number(event.target.value),
                  );
                  setSubmitError(null);
                }}
                disabled={isPending}
                required
              />
            </div>
          </div>
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs text-muted-foreground">
              最大{REPORT_RANGE_LIMIT}レスまで。既定はNo.{defaultSeq}単体です。
              {wholeThreadRange.usesRecentRange && (
                <>
                  <br />
                  スレ全体は直近{REPORT_RANGE_LIMIT}レス（No.
                  {wholeThreadRange.fromSeq}〜{wholeThreadRange.toSeq}
                  ）に調整されます。
                </>
              )}
            </p>
            <Button
              type="button"
              variant="ghost"
              className="px-2 py-1 text-xs"
              onClick={handleWholeThread}
              disabled={isPending}
            >
              スレ全体（{wholeThreadRange.fromSeq}〜{wholeThreadRange.toSeq}）
            </Button>
          </div>
        </fieldset>

        <div className="space-y-2">
          <label
            className="text-sm font-medium text-foreground"
            htmlFor={`${formId}-reason`}
          >
            通報理由
          </label>
          <select
            id={`${formId}-reason`}
            value={reason}
            onChange={(event: React.ChangeEvent<HTMLSelectElement>): void => {
              setReason(event.target.value as ReportReason | "");
              setSubmitError(null);
            }}
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
            htmlFor={`${formId}-detail`}
          >
            詳細（任意）
          </label>
          <Textarea
            id={`${formId}-detail`}
            value={detail}
            onChange={(event: React.ChangeEvent<HTMLTextAreaElement>): void => {
              setDetail(event.target.value);
              setSubmitError(null);
            }}
            placeholder="補足があれば入力してください"
            rows={4}
            maxLength={200}
            disabled={isPending}
          />
          <p className="text-right text-xs text-muted-foreground">
            {detail.length}/200
          </p>
        </div>

        {submitError && (
          <p className="text-sm text-destructive" role="alert">
            {submitError}
          </p>
        )}

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
