import { describe, expect, test } from "bun:test";

describe("ThreadCreateForm draft persistence", () => {
  test("保存本文で初期化し、編集時に保存して成功時に削除する", async () => {
    const source = await Bun.file(
      new URL("./ThreadCreateForm.tsx", import.meta.url),
    ).text();

    expect(source).toContain("useState(readThreadCreateDraft)");
    expect(source).toContain("saveThreadCreateDraft(nextBody)");
    expect(source).toContain("clearThreadCreateDraft()");
  });

  test("本文または選択済み添付がある場合だけ送信可能にする", async () => {
    const source = await Bun.file(
      new URL("./ThreadCreateForm.tsx", import.meta.url),
    ).text();

    expect(source).toContain("selectHasSelectedFile");
    expect(source).toContain("state.hasSelectedFile");
    expect(source).toContain("hasPostContent(body, hasSelectedFile)");
  });

  test("保持期間を送信し、公開UIから永久指定を送らない", async () => {
    const formSource = await Bun.file(
      new URL("./ThreadCreateForm.tsx", import.meta.url),
    ).text();
    const submitSource = await Bun.file(
      new URL("../../../post/lib/submitPostFlow.ts", import.meta.url),
    ).text();

    expect(formSource).toContain('name="duration"');
    expect(formSource).toContain("duration,");
    expect(formSource).not.toContain("isPermanent");
    expect(submitSource).toContain("{ r18, allowImageReplies, duration }");
  });
});
