import clsx from "clsx";
import type React from "react";

interface SoudaneButtonProps {
  count: number;
  onClick: () => void;
  disabled?: boolean;
  frozen?: boolean;
}

/**
 * そうだねボタンコンポーネント
 * スレッドまたは投稿に対する「そうだね」機能を提供
 * セマンティックカラー（quote）を使用してテーマ対応
 */
export const SoudaneButton: React.FunctionComponent<SoudaneButtonProps> = ({
  count,
  onClick,
  disabled,
  frozen = false,
}: SoudaneButtonProps) => {
  if (frozen) {
    return (
      <span className="px-2 py-1 text-muted-foreground">そうだねx{count}</span>
    );
  }

  return (
    <label
      className={clsx(
        "transition-colors p-1 px-2",
        disabled
          ? "text-muted"
          : "bg-soudane/5 text-soudane hover:bg-soudane/20 rounded-md cursor-pointer",
      )}
    >
      <button type="button" onClick={onClick} disabled={disabled} />
      {count === 0 ? "+" : `そうだねx${count}`}
    </label>
  );
};
