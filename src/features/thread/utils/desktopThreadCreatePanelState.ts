export interface DesktopThreadCreatePanelAction {
  nextManuallyCollapsed: boolean;
  closeExternalOpen: boolean;
}

export function getDesktopThreadCreatePanelAction(
  isOpen: boolean,
  manuallyCollapsed: boolean,
): DesktopThreadCreatePanelAction {
  if (isOpen) {
    return { nextManuallyCollapsed: true, closeExternalOpen: true };
  }
  return {
    nextManuallyCollapsed: !manuallyCollapsed,
    closeExternalOpen: false,
  };
}
