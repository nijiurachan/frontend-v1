import { describe, expect, test } from "bun:test";
import { getCreatedThreadRoute } from "./createdThreadRoute";

describe("getCreatedThreadRoute", () => {
  test("作成結果のthreadIdをスレッド詳細ルートへ渡す", () => {
    expect(getCreatedThreadRoute("created-thread-id")).toEqual({
      to: "/thread/$threadId",
      params: { threadId: "created-thread-id" },
    });
  });
});
