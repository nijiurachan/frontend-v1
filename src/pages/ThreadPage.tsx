import { useParams, useSearch } from "@tanstack/react-router";
import { ThreadView } from "@/features/thread/components/views";

export const ThreadPage: React.FunctionComponent = () => {
  const { threadId } = useParams({ from: "/thread/$threadId" });
  const { archivedAt } = useSearch({ from: "/thread/$threadId" });
  return <ThreadView threadId={threadId} archivedAt={archivedAt} />;
};
