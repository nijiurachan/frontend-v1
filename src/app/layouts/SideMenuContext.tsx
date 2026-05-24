import { createContext, useContext } from "react";

interface SideMenuContextType {
  openSideMenu: () => void;
}

export const SideMenuContext: React.Context<SideMenuContextType | null> =
  createContext<SideMenuContextType | null>(null);

export function useSideMenu(): SideMenuContextType {
  const context = useContext(SideMenuContext);
  if (!context) {
    throw new Error("useSideMenu must be used within SideMenuProvider");
  }
  return context;
}
