import { describe, expect, test } from "bun:test";

describe("投稿フォームのclose lifecycle", () => {
  test("mobile modal_closeで保持中formを非activeにする", async () => {
    const replyModal = await Bun.file(
      new URL("../../thread/components/modals/ReplyModal.tsx", import.meta.url),
    ).text();
    const threadModal = await Bun.file(
      new URL(
        "../../thread/components/modals/ThreadCreateModal.tsx",
        import.meta.url,
      ),
    ).text();

    expect(replyModal).toContain("active={isOpen}");
    expect(threadModal).toContain("active={isOpen}");
  });

  test("desktop panel_collapseで保持中formを非activeにする", async () => {
    const replyPanel = await Bun.file(
      new URL(
        "../../thread/components/desktop/DesktopReplyPanel.tsx",
        import.meta.url,
      ),
    ).text();
    const threadPanel = await Bun.file(
      new URL(
        "../../thread/components/desktop/DesktopThreadCreatePanel.tsx",
        import.meta.url,
      ),
    ).text();

    expect(replyPanel).toContain("active={!collapsed}");
    expect(threadPanel).toContain("active={!collapsed}");
  });

  test("form_non-activeで進行中処理とwidgetをresetする", async () => {
    const replyForm = await Bun.file(
      new URL("./forms/PostForm.tsx", import.meta.url),
    ).text();
    const threadForm = await Bun.file(
      new URL(
        "../../thread/components/forms/ThreadCreateForm.tsx",
        import.meta.url,
      ),
    ).text();

    for (const source of [replyForm, threadForm]) {
      expect(source).toContain("if (!active)");
      expect(source).toContain("submissionLifecycle.invalidate();");
      expect(source).toContain("altchaRef.current?.reset();");
      expect(source).toContain('dispatchSubmissionUi({ type: "reset" });');
    }

    expect(replyForm).toContain("clearSuccessTimer();");
    expect(replyForm).toContain("successTimerRef.current = null;");
  });
});
