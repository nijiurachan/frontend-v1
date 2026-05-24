import { PersistentModal } from "@/shared/ui/overlay";
import { ThreadCreateForm } from "../forms/ThreadCreateForm";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const ThreadCreateModal: React.FunctionComponent<Props> = ({
  isOpen,
  onClose,
}: Props) => {
  return (
    <PersistentModal
      isOpen={isOpen}
      onClose={onClose}
      title="新規スレッド"
      position="bottom"
    >
      <div className="p-4">
        <ThreadCreateForm onSuccess={onClose} />
      </div>
    </PersistentModal>
  );
};
