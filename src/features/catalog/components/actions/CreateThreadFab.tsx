import { FiPlus } from "react-icons/fi";

interface Props {
  onClick: () => void;
}

export const CreateThreadFab: React.FunctionComponent<Props> = ({
  onClick,
}: Props) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className="fixed bottom-20 right-4 w-14 h-14 flex items-center justify-center bg-primary hover:bg-primary/90 text-primary-foreground rounded-full shadow-lg transition-colors z-30"
      aria-label="スレッド作成"
    >
      <FiPlus className="w-6 h-6" />
    </button>
  );
};
