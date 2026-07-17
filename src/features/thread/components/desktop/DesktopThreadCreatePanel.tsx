import { useState } from "react";
import { ThreadCreateForm } from "../forms/ThreadCreateForm";

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

  return (
    <aside
      className="desktop-floating-panel"
      data-kind="thread"
      data-collapsed={collapsed}
      aria-label="スレ立てフォーム"
    >
      <button
        type="button"
        className="desktop-floating-tab"
        onClick={(): void => setManuallyCollapsed((value) => !value)}
        aria-expanded={!collapsed}
      >
        <span aria-hidden="true">◀</span>スレ立て
      </button>
      <div className="desktop-floating-content">
        <div className="desktop-floating-heading">新規スレッド</div>
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
