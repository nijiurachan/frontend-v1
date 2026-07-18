import { describe, expect, test } from "bun:test";
import { getCatalogThreadClickAction } from "@/features/catalog/utils/catalogReveal";

describe("getCatalogThreadClickAction", () => {
  test("NGかつR18はNG解除後の次タップでR18を解除できる", () => {
    expect(
      getCatalogThreadClickAction({
        isNg: true,
        ngRevealed: false,
        isR18Hidden: true,
      }),
    ).toBe("toggle-ng");
    expect(
      getCatalogThreadClickAction({
        isNg: true,
        ngRevealed: true,
        isR18Hidden: true,
      }),
    ).toBe("reveal-r18");
    expect(
      getCatalogThreadClickAction({
        isNg: true,
        ngRevealed: true,
        isR18Hidden: false,
      }),
    ).toBe("view");
  });
});
