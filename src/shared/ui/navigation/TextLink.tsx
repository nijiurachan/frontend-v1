import { Link } from "@tanstack/react-router";
import { cn } from "@/shared/lib";

export type TextLinkVariant = "primary" | "secondary" | "muted" | "destructive";

export type TextLinkProps = Omit<
  React.AnchorHTMLAttributes<HTMLAnchorElement>,
  "href"
> & {
  /**
   * リンクのバリエーション
   * - primary: メインカラー
   * - secondary: セカンダリカラー
   * - muted: 控えめなカラー
   * - destructive: 警告・削除アクション
   */
  variant?: TextLinkVariant;
} & (
    | {
        /**
         * TanStack Routerの内部リンク先
         */
        to: string;
        params?: Record<string, unknown>;
      }
    | {
        /**
         * 外部リンク先
         */
        href: string;
      }
  );

/**
 * テキストリンクコンポーネント
 * variant、underlineオプションで柔軟にスタイルを変更可能
 */
export const TextLink: React.FunctionComponent<TextLinkProps> = ({
  className,
  variant = "primary",
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
  if ("to" in props) {
    return (
      <Link className={classes} {...props}>
        {children}
      </Link>
    );
  }

  // 外部リンク
  if ("href" in props) {
    return (
      <a
        target="_blank"
        rel="noopener noreferrer"
        className={classes}
        {...props}
      >
        {children}
      </a>
    );
  }

  // ここには到達しえない
  throw new Error(`Unexpected value: ${props satisfies never}`);
};
