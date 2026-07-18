import { describe, expect, test } from "bun:test";
import { getApiUiUrl } from "@/shared/lib/apiDocsUrl";

describe("getApiUiUrl", () => {
  test("空のbase URLでは同一originのパスを返す", () => {
    expect(getApiUiUrl("")).toBe("/api/ui");
    expect(getApiUiUrl("   ")).toBe("/api/ui");
  });

  test("base URLの末尾slash有無に関係なくAPI originへ組み立てる", () => {
    expect(getApiUiUrl("https://api.example.com")).toBe(
      "https://api.example.com/api/ui",
    );
    expect(getApiUiUrl("https://api.example.com/")).toBe(
      "https://api.example.com/api/ui",
    );
  });

  test("base URLにパスがあってもAPI originのルートを使う", () => {
    expect(getApiUiUrl("https://api.example.com/backend/")).toBe(
      "https://api.example.com/api/ui",
    );
  });
});
