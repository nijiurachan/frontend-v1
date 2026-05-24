import type { ReactNode } from "react";
import { cn } from "@/shared/lib";

type MessageVariant = "error" | "success" | "info" | "warning";

interface MessageProps {
  variant?: MessageVariant;
  children: ReactNode;
  className?: string;
}

const variantStyles: Record<MessageVariant, string> = {
  error: "text-destructive",
  success: "text-green-600",
  info: "text-foreground",
  warning: "text-yellow-600",
};

/**
 * メッセージ表示コンポーネント
 * エラー、成功、情報などのメッセージを統一されたスタイルで表示
 */
export const Message: React.FunctionComponent<MessageProps> = ({
  variant = "info",
  children,
  className,
}: MessageProps) => {
  return (
    <div
      className={cn(
        "flex items-center justify-center min-h-[200px]",
        variantStyles[variant],
        className,
      )}
    >
      {children}
    </div>
  );
};
