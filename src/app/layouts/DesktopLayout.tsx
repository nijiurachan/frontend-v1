import type { ReactNode } from "react";
import { DesktopHeader } from "@/app/layouts/DesktopHeader";
import { useIsPcForced } from "@/shared/hooks/useMediaQuery";

interface Props {
  children: ReactNode;
}

/** 旧AI_BBS PC版の余白と固定ヘッダーを再現するデスクトップ枠。 */
export const DesktopLayout: React.FunctionComponent<Props> = ({
  children,
}: Props) => {
  const isPcForced = useIsPcForced();

  return (
    <div
      className="desktop-app min-h-screen bg-background text-foreground"
      data-force-pc={isPcForced || undefined}
    >
      <DesktopHeader />
      <main id="main-content" tabIndex={-1} className="desktop-main">
        {children}
      </main>
    </div>
  );
};
