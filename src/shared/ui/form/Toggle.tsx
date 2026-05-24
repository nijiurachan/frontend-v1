import { cn } from "@/shared/lib";

interface ToggleProps {
  checked: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
  "aria-label"?: string;
}

/**
 * トグルスイッチコンポーネント
 * セマンティックカラー（primary/muted）を使用したアクセシブルなスイッチ
 */
export const Toggle: React.FunctionComponent<ToggleProps> = ({
  checked,
  onChange,
  disabled,
  "aria-label": ariaLabel,
}: ToggleProps) => (
  <button
    type="button"
    onClick={(): void => onChange(!checked)}
    disabled={disabled}
    className={cn(
      "relative w-11 h-6 rounded-full transition-colors",
      checked ? "bg-primary" : "bg-muted",
      disabled && "opacity-50 cursor-not-allowed",
    )}
    role="switch"
    aria-checked={checked}
    aria-label={ariaLabel}
  >
    <span
      className={cn(
        "absolute top-1 w-4 h-4 rounded-full transition-transform",
        checked ? "bg-background left-6" : "bg-foreground left-1",
      )}
    />
  </button>
);
