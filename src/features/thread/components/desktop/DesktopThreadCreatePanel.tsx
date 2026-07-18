import { useState } from "react";
import { ThreadCreateForm } from "@/features/thread/components/forms/ThreadCreateForm";
import { getDesktopThreadCreatePanelAction } from "@/features/thread/utils/desktopThreadCreatePanelState";
import { useDraggablePanel } from "@/shared/hooks";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

/** 旧PC版の右端「スレ立て」折りたたみパネル。 */
export const DesktopThreadCreatePanel: React.FunctionComponent<Props> = ({
  isOpen,
  onClose,
}: Props) => {
  const [manuallyCollapsed, setManuallyCollapsed] = useState(true);
  const collapsed = isOpen ? false : manuallyCollapsed;
  const { panelRef, panelStyle, handleProps } = useDraggablePanel();

  const handleTabClick = (): void => {
    const action = getDesktopThreadCreatePanelAction(isOpen, manuallyCollapsed);
    setManuallyCollapsed(action.nextManuallyCollapsed);
    if (action.closeExternalOpen) onClose();
  };

  return (
    <aside
      ref={panelRef}
      style={panelStyle}
      className="desktop-floating-panel"
      data-kind="thread"
      data-collapsed={collapsed}
      aria-label="スレ立てフォーム"
    >
      <button
        type="button"
        className="desktop-floating-tab"
        onClick={handleTabClick}
        aria-expanded={!collapsed}
      >
        <span aria-hidden="true">◀</span>スレ立て
      </button>
      <div className="desktop-floating-content">
        <div className="desktop-floating-heading" {...handleProps}>
          新規スレッド
        </div>
        <div className="desktop-floating-form">
          <ThreadCreateForm
            onSuccess={(): void => {
              onClose();
              setManuallyCollapsed(true);
            }}
          />
        </div>
      </div>
    </aside>
  );
};
