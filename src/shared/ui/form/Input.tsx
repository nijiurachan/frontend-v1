import { cn } from "@/shared/lib";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  /**
   * バリデーションエラー状態
   */
  error?: boolean;
}

/**
 * 汎用テキスト入力コンポーネント
 * セマンティックカラーを使用し、フォーカス状態でprimaryカラーに変化
 */
export const Input: React.FunctionComponent<InputProps> = ({
  className,
  error,
  ...props
}: InputProps) => (
  <input
    className={cn(
      "px-3 py-2 bg-muted border border-border rounded-lg text-sm text-foreground",
      "placeholder-muted-foreground",
      "focus:outline-none focus:border-primary",
      "disabled:opacity-50 disabled:cursor-not-allowed",
      error && "border-destructive focus:border-destructive",
      className,
    )}
    {...props}
  />
);

Input.displayName = "Input";
