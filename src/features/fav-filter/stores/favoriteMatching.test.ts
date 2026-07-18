import { describe, expect, test } from "bun:test";
import {
  compareFavoriteJapanese,
  matchesFavoriteText,
} from "@/features/fav-filter/stores/favStore";

describe("classic favorite matching", () => {
  test("matches favorite regular expressions case-insensitively", () => {
    expect(matchesFavoriteText("AIMOGE catalog", [], ["aimoge"])).toBe(true);
  });

  test("sorts katakana and hiragana by normalized Japanese text stably", () => {
    const values = ["カタログ", "あいもげ", "かたろぐ"];
    const sorted = values
      .map((value, index) => ({ value, index }))
      .sort((left, right) =>
        compareFavoriteJapanese(
          left.value,
          right.value,
          left.index,
          right.index,
        ),
      )
      .map(({ value }) => value);

    expect(sorted).toEqual(["あいもげ", "カタログ", "かたろぐ"]);
  });
});
