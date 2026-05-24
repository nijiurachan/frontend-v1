import { cn } from "@/shared/lib";

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

/**
 * 汎用テキストエリアコンポーネント
 * Inputと同じデザイン言語を共有
 */
export const Textarea: React.FC<TextareaProps> = ({
  className,
  error,
  ...props
}: TextareaProps) => (
  <textarea
    className={cn(
      "w-full px-3 py-2 bg-muted border border-border rounded-lg text-sm text-foreground",
      "placeholder-muted-foreground",
      "focus:outline-none focus:border-primary",
      "disabled:opacity-50 disabled:cursor-not-allowed resize-none",
      error && "border-destructive focus:border-destructive",
      className,
    )}
    {...props}
  />
);

Textarea.displayName = "Textarea";
