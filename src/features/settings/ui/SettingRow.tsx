import { cn } from "@/shared/lib";

export interface SettingRowProps {
  /**
   * 設定項目のラベル（文字列またはReactノード）
   */
  label?: React.ReactNode;
  /**
   * 設定のコントロール部分（Toggle、Select等）
   */
  children?: React.ReactNode;
  /**
   * オプションの説明文
   */
  description?: string | React.ReactNode;
  /**
   * カスタムクラス名
   */
  className?: string;
}

/**
 * 設定画面用の行コンポーネント
 * ラベルとコントロールを左右に配置し、オプションで説明文を表示
 */
export const SettingRow: React.FunctionComponent<SettingRowProps> = ({
  label,
  children,
  description,
  className,
}: SettingRowProps) => {
  return (
    <div className={cn("px-4", description ? "pt-3" : "py-3", className)}>
      <div className="flex items-center justify-between gap-3">
        {label && <div className="text-sm text-foreground">{label}</div>}
        {children}
      </div>
      {description && (
        <p className="text-sm text-muted-foreground mt-2 pb-3">{description}</p>
      )}
    </div>
  );
};
