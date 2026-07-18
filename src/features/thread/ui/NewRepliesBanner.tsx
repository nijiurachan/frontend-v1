import { FiRefreshCw } from "react-icons/fi";

interface Props {
  newCount: number;
  onAccept: () => void;
}

export const NewRepliesBanner: React.FunctionComponent<Props> = ({
  newCount,
  onAccept,
}: Props) => {
  if (newCount <= 0) return null;

  return (
    <button
      type="button"
      className="new-replies-banner"
      onClick={onAccept}
      aria-live="polite"
    >
      <FiRefreshCw aria-hidden="true" />
      新着{newCount}件を表示
    </button>
  );
};
