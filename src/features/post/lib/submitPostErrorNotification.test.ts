import { describe, expect, test } from "bun:test";
import { notifySubmitError } from "@/features/post/lib/submitPostErrorNotification";

describe("投稿エラーtoast", () => {
  test("submission abortではtoastを発生させない", () => {
    const messages: string[] = [];

    notifySubmitError(
      new DOMException("The operation was aborted", "AbortError"),
      (message) => messages.push(message),
    );

    expect(messages).toEqual([]);
  });

  test("通常エラーは従来どおりtoastへ通知する", () => {
    const messages: string[] = [];

    notifySubmitError(new TypeError("fetch failed"), (message) =>
      messages.push(message),
    );

    expect(messages).toEqual(["fetch failed"]);
  });
});
