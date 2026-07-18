import { describe, expect, test } from "bun:test";
import { formatPostBodyLength, POST_BODY_MAX_LENGTH } from "./postFormConfig";

describe("postFormConfig", () => {
  test("バックエンド既定値と同じ4000文字上限を表示する", () => {
    expect(POST_BODY_MAX_LENGTH).toBe(4000);
    expect(formatPostBodyLength(4000)).toBe("4000 / 4000文字");
  });
});
