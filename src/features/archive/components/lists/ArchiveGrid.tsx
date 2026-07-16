import { ArchiveItem } from "@/features/archive/components/lists/ArchiveItem";
import type { ArchiveThread } from "@/features/archive/types";
import { Message } from "@/shared/ui/feedback";

interface ArchiveGridProps {
  threads: ArchiveThread[];
}

export const ArchiveGrid: React.FunctionComponent<ArchiveGridProps> = ({
  threads,
}: ArchiveGridProps) => {
  if (threads.length === 0) {
    return <Message variant="info">過去ログはまだありません</Message>;
  }

  return (
    <div className="grid gap-2 p-2 pb-20 grid-cols-2 sm:grid-cols-3">
      {threads.map((thread) => (
        <ArchiveItem key={thread.id} thread={thread} />
      ))}
    </div>
  );
};
