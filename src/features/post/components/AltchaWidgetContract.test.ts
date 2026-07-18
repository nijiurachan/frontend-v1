import { describe, expect, test } from "bun:test";

describe("公式ALTCHA widget integration", () => {
  test("component_standard checkbox・日本語・状態通知・再試行を利用者へ表示する", async () => {
    const source = await Bun.file(
      new URL("./AltchaWidget.tsx", import.meta.url),
    ).text();

    expect(source).toContain("<altcha-widget");
    expect(source).toContain("forwardRef<AltchaWidgetHandle, Props>");
    expect(source).toContain('display="standard"');
    expect(source).toContain('type="checkbox"');
    expect(source).toContain('language="ja"');
    expect(source).toContain("<output");
    expect(source).toContain('aria-live="polite"');
    expect(source).toContain("認証を再試行");
    expect(source).toContain('addEventListener("verified"');
    expect(source).toContain('addEventListener("statechange"');
    expect(source).toContain('addEventListener("expired"');
  });

  test("forms_スレ立てと返信の両方へ常時widgetを置く", async () => {
    const replySource = await Bun.file(
      new URL("./forms/PostForm.tsx", import.meta.url),
    ).text();
    const threadSource = await Bun.file(
      new URL(
        "../../thread/components/forms/ThreadCreateForm.tsx",
        import.meta.url,
      ),
    ).text();

    expect(replySource).toContain('<AltchaWidget operation="reply"');
    expect(threadSource).toContain('<AltchaWidget operation="thread"');
  });
});
