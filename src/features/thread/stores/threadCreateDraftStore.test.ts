import { describe, expect, test } from "bun:test";
import {
  clearThreadCreateDraft,
  readThreadCreateDraft,
  saveThreadCreateDraft,
} from "./threadCreateDraftStore";

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

describe("threadCreateDraftStore", () => {
  test("作成本文を保存して再マウント相当の読み出しで復元する", () => {
    const storage = createStorage();

    saveThreadCreateDraft("スレッド本文の下書き", storage);

    expect(readThreadCreateDraft(storage)).toBe("スレッド本文の下書き");
  });

  test("作成成功時に保存済み本文を削除する", () => {
    const storage = createStorage();
    saveThreadCreateDraft("送信済み", storage);

    clearThreadCreateDraft(storage);

    expect(readThreadCreateDraft(storage)).toBe("");
  });
});
