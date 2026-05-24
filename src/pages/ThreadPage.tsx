import { useParams } from "@tanstack/react-router";
import { ThreadView } from "@/features/thread/components/views";
import { Message } from "@/shared/ui/feedback";
import { TextLink } from "@/shared/ui/navigation";

export const ThreadPage: React.FunctionComponent = () => {
  const { threadId } = useParams({ from: "/thread/$threadId" });
  const id = Number(threadId);

  if (!id || Number.isNaN(id)) {
    return (
      <div className="flex flex-col items-center gap-4 p-4">
        <Message variant="error">無効なスレッドIDです</Message>
        <TextLink to="/">カタログに戻る</TextLink>
      </div>
    );
  }

  return <ThreadView threadId={id} />;
};
