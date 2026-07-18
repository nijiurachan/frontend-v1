import { describe, expect, test } from "bun:test";
import { getDesktopThreadCreatePanelAction } from "@/features/thread/utils/desktopThreadCreatePanelState";

describe("getDesktopThreadCreatePanelAction", () => {
  test("外部操作で開いたpanelをtab操作で閉じる", () => {
    expect(getDesktopThreadCreatePanelAction(true, true)).toEqual({
      nextManuallyCollapsed: true,
      closeExternalOpen: true,
    });
  });

  test("外部openでなければ従来どおり手動状態をtoggleする", () => {
    expect(getDesktopThreadCreatePanelAction(false, true)).toEqual({
      nextManuallyCollapsed: false,
      closeExternalOpen: false,
    });
  });
});
