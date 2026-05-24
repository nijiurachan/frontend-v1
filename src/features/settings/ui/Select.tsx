import { cn } from "@/shared/lib";

interface SelectProps
  extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "onChange"> {
  onChange: (value: string) => void;
  children: React.ReactNode;
  className?: string;
}

/**
 * セレクトボックスコンポーネント
 * セマンティックカラーを使用したテーマ対応のセレクトボックス
 */
export const Select: React.FunctionComponent<SelectProps> = ({
  value,
  onChange,
  children,
  className,
  disabled,
  ...props
}: SelectProps) => {
  return (
    <select
      value={value}
      onChange={(
        e: React.ChangeEvent<HTMLSelectElement, HTMLSelectElement>,
      ): void => onChange(e.target.value)}
      disabled={disabled}
      className={cn(
        "px-3 py-1.5 bg-muted border border-border rounded text-sm text-foreground",
        "focus:outline-none focus:ring-2 focus:ring-primary/50",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
};
