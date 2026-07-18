import { describe, expect, test } from "bun:test";
import { ApiError } from "../../../shared/api/errors";
import { isDuplicateSoudaneError } from "./soudaneError";

describe("isDuplicateSoudaneError", () => {
  test("409 DUPLICATE_REACTIONだけを冪等成功として扱う", () => {
    expect(
      isDuplicateSoudaneError(
        new ApiError("すでに投票済みです", 409, "DUPLICATE_REACTION"),
      ),
    ).toBe(true);
    expect(
      isDuplicateSoudaneError(
        new ApiError("conflict", 409, "ANOTHER_CONFLICT"),
      ),
    ).toBe(false);
    expect(
      isDuplicateSoudaneError(
        new ApiError("duplicate", 400, "DUPLICATE_REACTION"),
      ),
    ).toBe(false);
  });

  test("mutation内で重複投票を成功レスポンスへ変換する", async () => {
    const source = await Bun.file(
      new URL("./useSoudaneMutation.ts", import.meta.url),
    ).text();

    expect(source).toContain("if (isDuplicateSoudaneError(error))");
    expect(source).toContain('return { postId, type: "up" }');
  });
});
