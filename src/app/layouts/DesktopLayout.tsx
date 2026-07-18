import type { ReactNode } from "react";
import { DesktopHeader } from "./DesktopHeader";

interface Props {
  children: ReactNode;
}

/** 旧AI_BBS PC版の余白と固定ヘッダーを再現するデスクトップ枠。 */
export const DesktopLayout: React.FunctionComponent<Props> = ({
  children,
}: Props) => (
  <div className="desktop-app min-h-screen bg-background text-foreground">
    <DesktopHeader />
    <main id="main-content" className="desktop-main">
      {children}
    </main>
  </div>
);
