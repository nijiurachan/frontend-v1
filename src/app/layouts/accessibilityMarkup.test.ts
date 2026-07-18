import { describe, expect, test } from "bun:test";
import { readFile } from "node:fs/promises";

const readSource = (relativePath: string): Promise<string> =>
  readFile(new URL(relativePath, import.meta.url), "utf8");

describe("layout accessibility markup", () => {
  test("side_menu_escape_and_close_button_are_accessible", async () => {
    const source = await readSource("./SideMenu.tsx");

    expect(source).toContain('event.key === "Escape"');
    expect(source).toContain('role="dialog"');
    expect(source).toContain('aria-modal="true"');
    expect(source).toContain('aria-labelledby="side-menu-title"');
    expect(source).toContain('aria-label="閉じる"');
  });

  test("modal_dialog_is_labelled_by_its_title", async () => {
    const source = await readSource("../../shared/ui/overlay/Modal.tsx");

    expect(source).toContain('role="dialog"');
    expect(source).toContain('aria-modal="true"');
    expect(source).toContain("aria-labelledby={title ? titleId : undefined}");
    expect(source).toContain("id={titleId}");
    expect(source).toContain('aria-label="閉じる"');
  });

  test("skip_link_precedes_external_desktop_navigation", async () => {
    const source = await readSource("./DesktopHeader.tsx");
    const mobileSource = await readSource("./Header.tsx");
    const mobileLayoutSource = await readSource("./MobileLayout.tsx");
    const utilityNavigation = source.indexOf(
      'className="desktop-header-utilities col-start-3 row-start-1"',
    );
    const externalNavigation = source.indexOf(
      'className="desktop-header-links col-start-1 row-start-1"',
    );

    expect(source).toContain('href="#main-content"');
    expect(mobileSource).toContain('href="#main-content"');
    expect(mobileLayoutSource).toContain('id="main-content"');
    expect(utilityNavigation).toBeGreaterThanOrEqual(0);
    expect(externalNavigation).toBeGreaterThan(utilityNavigation);
  });

  test("settings_selects_and_back_link_have_accessible_names", async () => {
    const displaySettings = await readSource(
      "../../features/settings/components/sections/DisplaySettings.tsx",
    );
    const settingsPage = await readSource("../../pages/SettingsPage.tsx");

    expect(displaySettings).toContain('aria-label="カタログ列数"');
    expect(displaySettings).toContain('aria-label="メニューの開き方"');
    expect(settingsPage).toContain('aria-label="カタログに戻る"');

    const tagFilter = await readSource(
      "../../features/catalog/components/TagFilter.tsx",
    );
    expect(tagFilter).toContain("min-h-11");
  });
});
