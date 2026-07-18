import { describe, expect, test } from "bun:test";
import { getCatalogPath } from "@/features/catalog/hooks/catalogPath";
import type { SortType } from "@/features/catalog/stores/catalogStore";

describe("getCatalogPath", () => {
  test.each([
    ["default", "/catalog?sort=bump"],
    ["created", "/catalog?sort=new"],
    ["old", "/catalog?sort=old"],
    ["replies", "/catalog?sort=replies"],
  ] satisfies [SortType, string][])("%s のAPIパスを返す", (sort, path) => {
    expect(getCatalogPath(sort)).toBe(path);
  });
});
