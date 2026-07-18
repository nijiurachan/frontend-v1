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
    expect(source).toContain("useDialogFocusTrap");
  });

  test("modal_dialog_is_labelled_by_its_title", async () => {
    const source = await readSource("../../shared/ui/overlay/Modal.tsx");
    const threadContextMenu = await readSource(
      "../../features/catalog/components/actions/ThreadContextMenu.tsx",
    );

    expect(source).toContain('role="dialog"');
    expect(source).toContain('aria-modal="true"');
    expect(source).toContain("aria-labelledby={title ? titleId : undefined}");
    expect(source).toContain("id={titleId}");
    expect(source).toContain('aria-label="閉じる"');
    expect(source).toContain("aria-label={title ? undefined : ariaLabel}");
    expect(source).toContain("useDialogFocusTrap");
    expect(threadContextMenu).toContain('ariaLabel="スレッド操作"');
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
    expect(mobileSource).toContain("focus:fixed");
    expect(mobileSource.indexOf('href="#main-content"')).toBeLessThan(
      mobileSource.indexOf("<header"),
    );
    expect(mobileLayoutSource).toContain('id="main-content"');
    expect(mobileLayoutSource).toContain("tabIndex={-1}");
    const desktopLayoutSource = await readSource("./DesktopLayout.tsx");
    expect(desktopLayoutSource).toContain("tabIndex={-1}");
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
    expect(tagFilter).toContain("aria-pressed={selectedTag === null}");
    expect(tagFilter).toContain("aria-pressed={selectedTag === tag}");
  });

  test("loading_screen_announces_status_updates", async () => {
    const source = await readSource("../../shared/ui/feedback/Loading.tsx");

    expect(source).toContain('role="status"');
    expect(source).toContain('aria-live="polite"');
  });
});
