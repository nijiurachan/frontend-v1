import { describe, expect, test } from "bun:test";

const cssUrl: URL = new URL("../../../../index.css", import.meta.url);
const viewUrl: URL = new URL("./DesktopThreadView.tsx", import.meta.url);

describe("desktop thread ultrawide layout", () => {
  test("仮想レス列を旧PC版と同じく左詰めで配置する", async () => {
    const css = await Bun.file(cssUrl).text();
    const postListRule = css.match(
      /\.desktop-thread-post-list\s*\{[^}]*\}/,
    )?.[0];

    expect(postListRule).toContain("width: min(100%, 920px)");
    expect(postListRule).toContain("margin: 0");
  });

  test("仮想化された長いスレでも先頭移動は即時に0へ固定する", async () => {
    const source = await Bun.file(viewUrl).text();

    expect(source).toContain('scrollTo({ top: 0, behavior: "auto" })');
  });
});
