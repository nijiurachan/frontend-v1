import { describe, expect, test } from "bun:test";
import { getCatalogPath } from "@/features/catalog/hooks/catalogPath";

describe("catalog server paging contract", () => {
  test("requests all six global server sorts without local reversal", () => {
    expect(getCatalogPath("bump", 1, 56)).toBe(
      "/catalog?sort=bump&page=1&limit=56",
    );
    expect(getCatalogPath("new", 2, 25)).toBe(
      "/catalog?sort=new&page=2&limit=25",
    );
    expect(getCatalogPath("old", 3, 25)).toBe(
      "/catalog?sort=old&page=3&limit=25",
    );
    expect(getCatalogPath("replies", 1, 100)).toBe(
      "/catalog?sort=replies&page=1&limit=100",
    );
    expect(getCatalogPath("momentum", 1, 100)).toBe(
      "/catalog?sort=momentum&page=1&limit=100",
    );
    expect(getCatalogPath("soudane", 1, 100)).toBe(
      "/catalog?sort=soudane&page=1&limit=100",
    );
  });
});
