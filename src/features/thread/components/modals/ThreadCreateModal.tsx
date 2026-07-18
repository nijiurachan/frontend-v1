import { ThreadCreateForm } from "@/features/thread/components/forms/ThreadCreateForm";
import { PersistentModal } from "@/shared/ui/overlay";

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
        <ThreadCreateForm active={isOpen} onSuccess={onClose} />
      </div>
    </PersistentModal>
  );
};
