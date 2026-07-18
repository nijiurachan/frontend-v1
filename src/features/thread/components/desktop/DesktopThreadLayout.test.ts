import { describe, expect, test } from "bun:test";

const cssUrl: URL = new URL("../../../../index.css", import.meta.url);

describe("desktop thread ultrawide layout", () => {
  test("仮想レス列を利用可能領域の中央へ配置する", async () => {
    const css = await Bun.file(cssUrl).text();
    const postListRule = css.match(
      /\.desktop-thread-post-list\s*\{[^}]*\}/,
    )?.[0];

    expect(postListRule).toContain("width: min(100%, 920px)");
    expect(postListRule).toContain("margin: 0 auto");
  });
});
