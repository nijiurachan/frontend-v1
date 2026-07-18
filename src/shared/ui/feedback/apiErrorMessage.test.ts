import { describe, expect, test } from "bun:test";
import { ApiError } from "../../api/errors";
import { getApiErrorMessage, isMissingThreadError } from "./apiErrorMessage";

describe("getApiErrorMessage", () => {
  test("投稿拒否コードを具体的な日本語へ変換する", () => {
    expect(
      getApiErrorMessage(
        new ApiError("Bad Request", 400, "VALIDATION_ERROR"),
        "投稿に失敗しました",
      ),
    ).toContain("4000文字以内");
    expect(
      getApiErrorMessage(
        new ApiError("投稿を受け付けられませんでした", 422, "SPAM_REJECTED"),
        "投稿に失敗しました",
      ),
    ).toContain("スパム判定");
    expect(
      getApiErrorMessage(
        new ApiError("Forbidden", 403, "ROLE_FORBIDDEN"),
        "操作に失敗しました",
      ),
    ).toContain("参加期間");
  });

  test("未定義コードではサーバー理由を保ち理由がなければ既定文言を返す", () => {
    expect(
      getApiErrorMessage(
        new ApiError("削除キーが一致しません", 403, "DELETE_KEY_MISMATCH"),
        "削除に失敗しました",
      ),
    ).toBe("削除キーが一致しません");
    expect(
      getApiErrorMessage(new ApiError("HTTP 500", 500), "削除に失敗しました"),
    ).toBe("削除に失敗しました");
  });

  test("INVALID_REQUESTは投稿以外でも使える汎用文言を返す", () => {
    expect(
      getApiErrorMessage(
        new ApiError("Bad Request", 400, "INVALID_REQUEST"),
        "操作に失敗しました",
      ),
    ).toBe("リクエスト内容を確認してください");
  });

  test("prototype由来のコードをエラーコード表として参照しない", () => {
    expect(
      getApiErrorMessage(
        new ApiError("server reason", 400, "toString"),
        "操作に失敗しました",
      ),
    ).toBe("server reason");
  });
});

describe("isMissingThreadError", () => {
  test("400と404だけを存在しないスレッド向けエラーとして扱う", () => {
    expect(isMissingThreadError(new ApiError("invalid", 400))).toBe(true);
    expect(isMissingThreadError(new ApiError("not found", 404))).toBe(true);
    expect(isMissingThreadError(new ApiError("server error", 500))).toBe(false);
  });
});
