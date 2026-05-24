import { cn } from "@/shared/lib";

interface CheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  disabled?: boolean;
  className?: string;
}

/**
 * チェックボックスコンポーネント
 * ラベル付きのチェックボックスを提供
 */
export const Checkbox: React.FunctionComponent<CheckboxProps> = ({
  checked,
  onChange,
  label,
  disabled = false,
  className,
}: CheckboxProps) => (
  <label
    className={cn(
      "flex items-center gap-2 text-sm text-foreground",
      disabled && "opacity-50 cursor-not-allowed",
      !disabled && "cursor-pointer",
      className,
    )}
  >
    <input
      type="checkbox"
      checked={checked}
      onChange={(e: React.ChangeEvent<HTMLInputElement>): void =>
        onChange(e.target.checked)
      }
      disabled={disabled}
      className="w-4 h-4 rounded border-border bg-card text-primary focus:ring-primary disabled:cursor-not-allowed"
    />
    {label}
  </label>
);
