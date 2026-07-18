import { describe, expect, test } from "bun:test";

const sourceUrl: URL = new URL(
  "./VirtualizedDesktopPostList.tsx",
  import.meta.url,
);

describe("virtualized desktop hash navigation", () => {
  test("初回表示のhashを投稿seqと仮想行indexへ解決する", async () => {
    const source = await Bun.file(sourceUrl).text();

    expect(source).toContain("resolvePostSeqFromHash(hash, allPosts)");
    expect(source).toContain(
      "visiblePosts.findIndex((post) => post.seq === postSeq)",
    );
  });

  test("仮想izerの準備後に対象行へ即時スクロールする", async () => {
    const source = await Bun.file(sourceUrl).text();

    expect(source).toMatch(
      /requestAnimationFrame\([\s\S]*?rowVirtualizer\.scrollToIndex\(index,[\s\S]*?align: "center"[\s\S]*?behavior: "auto"/,
    );
  });
});
