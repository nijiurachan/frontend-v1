import { describe, expect, test } from "bun:test";

const sourceUrl: URL = new URL("../QuoteHoverPreview.tsx", import.meta.url);

describe("quote hover preview guidance", () => {
  test("引用行とプレビューの異なるクリック動作を案内する", async () => {
    const source = await Bun.file(sourceUrl).text();

    expect(source).toContain("引用行は返信に引用・プレビューはレスへ移動");
    expect(source).toContain("onJumpToPost(target.seq)");
    expect(source).toContain('event.key === "Enter"');
    expect(source).toContain('role={previewMode === "interactive" ? "link"');
    expect(source).toContain('tabIndex={previewMode === "interactive" ? 0');
    expect(source).toContain("onFocus={(): void =>");
    expect(source).not.toContain(">クリックでレスへ移動</span>");
  });

  test("引用挿入操作はネイティブbuttonでキーボード利用できる", async () => {
    const lineDisplaySource = await Bun.file(
      new URL("../LineDisplay.tsx", import.meta.url),
    ).text();

    expect(lineDisplaySource).toContain('type="button"');
    expect(lineDisplaySource).toContain("onQuoteClick(line.text)");
  });
});
