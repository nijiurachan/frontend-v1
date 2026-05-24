import { Link } from "@tanstack/react-router";
import { cn } from "@/shared/lib";

export type ButtonVariant =
  | "default"
  | "primary"
  | "secondary"
  | "destructive"
  | "ghost"
  | "menu";

export interface ButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "onClick"> {
  /**
   * ボタンのバリエーション
   * - default: 標準ボタン
   * - primary: メインアクション
   * - secondary: サブアクション
   * - destructive: 削除・警告アクション
   * - ghost: 透明背景
   * - menu: メニュー項目スタイル
   */
  variant?: ButtonVariant;
  /**
   * アイコン（左側に配置）
   */
  icon?: React.ReactNode;
  /**
   * TanStack Routerのリンク先
   */
  to?: string;
  /**
   * リンク先
   */
  href?: string;
  /**
   * 内部リンクかどうか(指定するとリファラをそのまま送る)
   */
  isInternal?: boolean;
  /**
   * クリックハンドラ
   */
  onClick?: () => void;
}

/**
 * 汎用ボタンコンポーネント
 * variant、icon、to/hrefによって柔軟に動作を変更可能
 */
export const Button: React.FunctionComponent<ButtonProps> = ({
  className,
  variant = "default",
  icon,
  to,
  href,
  isInternal,
  children,
  onClick,
  ...props
}: ButtonProps) => {
  const baseClasses = cn(
    "inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg",
    "font-medium text-sm transition-colors text-nowrap",
    "disabled:opacity-50 disabled:cursor-not-allowed",
    "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
  );

  const variantClasses: Record<ButtonVariant, string> = {
    default: "bg-card text-foreground hover:bg-muted border border-border",
    primary: "bg-primary text-primary-foreground hover:bg-primary/90",
    secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/90",
    destructive:
      "bg-destructive text-destructive-foreground hover:bg-destructive/90",
    ghost: "text-foreground hover:bg-muted",
    menu: "w-full justify-start gap-3 px-4 py-3 text-left text-foreground hover:bg-muted rounded-lg",
  };

  const classes = cn(baseClasses, variantClasses[variant], className);

  const content = (
    <>
      {icon}
      <span>{children}</span>
    </>
  );

  // TanStack Router Link
  if (to) {
    return (
      <Link to={to} className={classes} onClick={onClick}>
        {content}
      </Link>
    );
  }

  if (href) {
    if (isInternal) {
      // 内部リンク
      return (
        <a href={href} className={classes} onClick={onClick}>
          {content}
        </a>
      );
    } else {
      // 外部リンク
      return (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className={classes}
          onClick={onClick}
        >
          {content}
        </a>
      );
    }
  }

  // 通常のボタン
  return (
    <button type="button" className={classes} onClick={onClick} {...props}>
      {content}
    </button>
  );
};

Button.displayName = "Button";
