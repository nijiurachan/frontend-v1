import { describe, expect, test } from "bun:test";
import { getInitialHeaderScrollY } from "@/app/layouts/headerScroll";

describe("getInitialHeaderScrollY", () => {
  test("復元済みscroll位置を初期比較位置として使う", () => {
    expect(getInitialHeaderScrollY({ scrollY: 640 } as Window)).toBe(640);
  });
});
