import { type ReactNode, useMemo, useState } from "react";
import { Header } from "@/app/layouts/Header";
import { SideMenu } from "@/app/layouts/SideMenu";
import { SideMenuContext } from "@/app/layouts/SideMenuContext";

interface Props {
  children: ReactNode;
}

export const MobileLayout: React.FunctionComponent<Props> = ({
  children,
}: Props) => {
  const [sideMenuOpen, setSideMenuOpen] = useState(false);

  const sideMenuContextValue = useMemo(
    () => ({ openSideMenu: () => setSideMenuOpen(true) }),
    [],
  );

  return (
    <SideMenuContext.Provider value={sideMenuContextValue}>
      <div className="min-h-screen bg-background text-foreground flex flex-col">
        <Header onMenuClick={(): void => setSideMenuOpen(true)} />

        {/* メインコンテンツ */}
        <main
          id="main-content"
          tabIndex={-1}
          className="flex-1 min-h-0 flex flex-col overflow-hidden pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)] pb-[env(safe-area-inset-bottom)]"
        >
          {children}
        </main>

        {/* モーダル */}
        <SideMenu
          isOpen={sideMenuOpen}
          onClose={(): void => setSideMenuOpen(false)}
        />
      </div>
    </SideMenuContext.Provider>
  );
};
