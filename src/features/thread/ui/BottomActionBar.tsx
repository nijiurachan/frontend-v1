import clsx from "clsx";
import type { IconType } from "react-icons";
import {
  PrimaryActionButton,
  type PrimaryActionButtonProps,
} from "@/shared/ui/navigation";

export interface ActionButton {
  icon: IconType;
  label: string;
  onClick?: () => void;
  isLoading?: boolean;
}

interface BottomActionBarProps {
  actions: ActionButton[];
  /** バー上に絶対配置で表示する FAB。バー高さに自動追従する。 */
  primaryAction?: Omit<PrimaryActionButtonProps, "className">;
}

/**
 * ボトムアクションバーコンポーネント
 * ページ下部に固定表示されるアクションボタン群
 * 各ページで異なるactionsを渡すことで柔軟に対応
 */
export const BottomActionBar: React.FunctionComponent<BottomActionBarProps> = ({
  actions,
  primaryAction,
}: BottomActionBarProps) => (
  <nav className="fixed bottom-0 left-0 right-0 pb-[env(safe-area-inset-bottom)] z-20 flex items-center justify-around bg-card border-t border-border">
    {primaryAction && (
      <PrimaryActionButton
        {...primaryAction}
        className="absolute right-4 bottom-full mb-2"
      />
    )}
    {actions.map(({ icon: Icon, label, onClick, isLoading }) => (
      <button
        type="button"
        key={label}
        onClick={onClick}
        disabled={isLoading}
        className="flex flex-1 flex-col items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors disabled:opacity-50 cursor-pointer"
        aria-label={label}
        title={label}
      >
        <Icon
          className={clsx("h-full w-7 py-2", isLoading ? "animate-spin" : "")}
        />
      </button>
    ))}
  </nav>
);
