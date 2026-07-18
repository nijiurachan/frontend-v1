import { describe, expect, test } from "bun:test";

const sourceUrl: URL = new URL("./DesktopThreadView.tsx", import.meta.url);

describe("desktop image list parity", () => {
  test("PCナビゲーションから画像一覧モーダルを開ける", async () => {
    const source = await Bun.file(sourceUrl).text();

    expect(source).toContain("setIsImageListOpen(true)");
    expect(source).toContain("画像一覧");
    expect(source).toMatch(
      /<ImageListModal\s+isOpen=\{isImageListOpen\}[\s\S]*?images=\{images\}[\s\S]*?allPosts=\{data\.posts\}/,
    );
  });

  test("モバイルと同様にNG表示設定を反映して画像を抽出する", async () => {
    const source = await Bun.file(sourceUrl).text();

    expect(source).toContain(
      "data.posts.filter((post) => !isPostHidden(post))",
    );
    expect(source).toContain("return extractImages(posts)");
  });

  test("PCナビゲーションから人気レスとスレ内検索を開ける", async () => {
    const source = await Bun.file(sourceUrl).text();

    expect(source).toContain("setIsPopularPostsOpen(true)");
    expect(source).toContain("setIsSearchOpen(true)");
    expect(source).toContain("<PopularPostsModal");
    expect(source).toContain("<SearchModal");
  });
});
