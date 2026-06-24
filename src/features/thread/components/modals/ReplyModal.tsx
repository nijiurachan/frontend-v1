import type { Thread } from "@/entities/thread";
import { PostForm } from "@/features/post/components/forms";
import { ReplyTargetTitle } from "@/features/thread/ui";
import { PersistentModal } from "@/shared/ui/overlay";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  thread: Thread;
  initialComment?: string;
  openCount?: number;
  contentKey?: string | number;
}

export const ReplyModal: React.FunctionComponent<Props> = ({
  isOpen,
  onClose,
  thread,
  initialComment,
  openCount,
  contentKey,
}: Props) => {
  return (
    <PersistentModal
      isOpen={isOpen}
      onClose={onClose}
      title={<ReplyTargetTitle thread={thread} />}
      position="bottom"
      contentKey={contentKey}
    >
      {({ destroy }: { destroy: () => void }): React.ReactNode => (
        <div className="p-4">
          <PostForm
            threadId={thread.id}
            allowImage={thread.allow_image_replies}
            isArchived={thread.is_archived}
            initialComment={initialComment}
            openCount={openCount}
            onSuccess={destroy}
          />
        </div>
      )}
    </PersistentModal>
  );
};
