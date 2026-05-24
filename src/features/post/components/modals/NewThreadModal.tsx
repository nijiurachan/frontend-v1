import { ThreadCreateForm } from "@/features/thread/components/forms";
import { Modal } from "@/shared/ui/overlay";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const NewThreadModal: React.FunctionComponent<Props> = ({
  isOpen,
  onClose,
}: Props) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="スレッドを立てる"
      position="center"
    >
      <div className="p-4">
        <ThreadCreateForm onSuccess={onClose} />
      </div>
    </Modal>
  );
};
