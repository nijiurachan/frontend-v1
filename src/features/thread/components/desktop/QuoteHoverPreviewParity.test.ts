import { describe, expect, test } from "bun:test";

const sourceUrl: URL = new URL("../QuoteHoverPreview.tsx", import.meta.url);

describe("quote hover preview guidance", () => {
  test("引用行とプレビューの異なるクリック動作を案内する", async () => {
    const source = await Bun.file(sourceUrl).text();

    expect(source).toContain("引用行は返信に引用・プレビューはレスへ移動");
    expect(source).toContain("onJumpToPost(target.seq)");
    expect(source).not.toContain(">クリックでレスへ移動</span>");
  });
});
