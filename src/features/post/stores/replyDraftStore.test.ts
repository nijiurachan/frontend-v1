import { describe, expect, test } from "bun:test";
import {
  clearReplyDraft,
  getReplyDraftStorageKey,
  readReplyDraft,
  saveReplyDraft,
} from "@/features/post/stores/replyDraftStore";

function createStorage(): Storage {
  const values = new Map<string, string>();
  return {
    get length(): number {
      return values.size;
    },
    clear: (): void => values.clear(),
    getItem: (key: string): string | null => values.get(key) ?? null,
    key: (index: number): string | null => [...values.keys()][index] ?? null,
    removeItem: (key: string): void => {
      values.delete(key);
    },
    setItem: (key: string, value: string): void => {
      values.set(key, value);
    },
  };
}

describe("replyDraftStore", () => {
  test("スレッドごとのキーで下書きを保存し復元する", () => {
    const storage = createStorage();
    saveReplyDraft("thread/1", "返信の下書き", storage);
    saveReplyDraft("thread-2", "別の下書き", storage);

    expect(getReplyDraftStorageKey("thread/1")).toBe(
      "aimg-reply-draft:thread%2F1",
    );
    expect(readReplyDraft("thread/1", storage)).toBe("返信の下書き");
    expect(readReplyDraft("thread-2", storage)).toBe("別の下書き");
  });

  test("送信成功時の削除は対象スレッドの下書きだけを消す", () => {
    const storage = createStorage();
    saveReplyDraft("thread-1", "送信済み", storage);
    saveReplyDraft("thread-2", "残す", storage);

    clearReplyDraft("thread-1", storage);

    expect(readReplyDraft("thread-1", storage)).toBe("");
    expect(readReplyDraft("thread-2", storage)).toBe("残す");
  });
});
