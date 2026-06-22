// src/features/jukebox/ui/ListenerCount.tsx
import { FiHeadphones } from "react-icons/fi";

interface ListenerCountProps {
  count: number;
}

export const ListenerCount: React.FunctionComponent<ListenerCountProps> = ({
  count,
}: ListenerCountProps) => {
  return (
    <div className="flex items-center gap-1 text-xs text-muted-foreground">
      <FiHeadphones aria-hidden="true" size={14} />
      <span>{count} 人が聴いています</span>
    </div>
  );
};
