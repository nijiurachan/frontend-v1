import { Button } from "../form";
import { Modal } from "./Modal";

export type CloseReason = "dismissed" | "pressed-cancel" | "pressed-confirm";

export type ConfirmDialogProps = {
  isOpen: boolean;
  onClose: (reason: CloseReason) => void;
  onConfirm?: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "default" | "destructive";
};

/**
 * 確認ダイアログコンポーネント
 * アクション実行前にユーザーに確認を求めるモーダル
 */
export const ConfirmDialog: React.FunctionComponent<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "実行",
  cancelText = "キャンセル",
  variant = "default",
}: ConfirmDialogProps) => {
  const handleConfirm = (): void => {
    onConfirm?.();
    onClose("pressed-confirm");
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={(): void => onClose("dismissed")}
      title={title}
      position="center"
    >
      <div className="p-4 space-y-4">
        <p className="text-foreground whitespace-pre-line">{message}</p>
        <div className="flex gap-3">
          <Button
            variant="default"
            className="flex-1"
            onClick={(): void => onClose("pressed-cancel")}
          >
            {cancelText}
          </Button>
          <Button variant={variant} className="flex-1" onClick={handleConfirm}>
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
