import { PostForm } from "@/features/post/components/forms";
import { PersistentModal } from "@/shared/ui/overlay";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  threadId: number;
  allowImage: boolean;
  isArchived?: boolean;
  initialComment?: string;
  openCount?: number;
  contentKey?: string | number;
}

export const ReplyModal: React.FunctionComponent<Props> = ({
  isOpen,
  onClose,
  threadId,
  allowImage,
  isArchived,
  initialComment,
  openCount,
  contentKey,
}: Props) => {
  return (
    <PersistentModal
      isOpen={isOpen}
      onClose={onClose}
      title="返信"
      position="bottom"
      contentKey={contentKey}
    >
      {({ destroy }: { destroy: () => void }): React.ReactNode => (
        <div className="p-4">
          <PostForm
            threadId={threadId}
            allowImage={allowImage}
            isArchived={isArchived}
            initialComment={initialComment}
            openCount={openCount}
            onSuccess={destroy}
          />
        </div>
      )}
    </PersistentModal>
  );
};
