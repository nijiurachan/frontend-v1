import { Button, type ButtonProps } from "@/shared/ui/form";

export type MenuItemProps = Omit<ButtonProps, "variant">;

/**
 * メニュー項目コンポーネント（Buttonのエイリアス）
 * SideMenuやナビゲーションで使用
 */
export const MenuItem: React.FunctionComponent<MenuItemProps> = (
  props: MenuItemProps,
) => {
  return <Button variant="menu" {...props} />;
};
