import { Link } from "@tanstack/react-router";
import { cn } from "@/shared/lib";

export type TextLinkVariant = "primary" | "secondary" | "muted" | "destructive";

export interface TextLinkProps
  extends Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href"> {
  /**
   * リンクのバリエーション
   * - primary: メインカラー
   * - secondary: セカンダリカラー
   * - muted: 控えめなカラー
   * - destructive: 警告・削除アクション
   */
  variant?: TextLinkVariant;
  /**
   * TanStack Routerの内部リンク先
   */
  to?: string;
  /**
   * 外部リンク先
   */
  href?: string;
}

/**
 * テキストリンクコンポーネント
 * variant、underlineオプションで柔軟にスタイルを変更可能
 */
export const TextLink: React.FunctionComponent<TextLinkProps> = ({
  className,
  variant = "primary",
  to,
  href,
  children,
  ...props
}: TextLinkProps) => {
  const variantClasses: Record<TextLinkVariant, string> = {
    primary: "text-primary hover:text-primary/80",
    secondary: "text-secondary hover:text-secondary/80",
    muted: "text-muted-foreground hover:text-foreground",
    destructive: "text-destructive hover:text-destructive/80",
  };

  const classes = cn(
    "transition-colors underline",
    variantClasses[variant],
    className,
  );

  // TanStack Router Link
  if (to) {
    return (
      <Link to={to} className={classes} {...props}>
        {children}
      </Link>
    );
  }

  // 外部リンク
  if (href) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={classes}
        {...props}
      >
        {children}
      </a>
    );
  }

  // toもhrefも指定されていない場合はエラー
  throw new Error('TextLink requires either "to" or "href" prop');
};
