import { describe, expect, test } from "bun:test";
import type { SortType } from "../stores/catalogStore";
import { getCatalogPath } from "./catalogPath";

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
