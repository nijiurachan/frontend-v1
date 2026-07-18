import { describe, expect, test } from "bun:test";
import {
  DEFAULT_MAX_ATTACHMENT_BYTES,
  MAX_ATTACHMENT_BYTES,
  readAttachmentForUpload,
} from "@/shared/api/attachmentUpload";

describe("readAttachmentForUpload", () => {
  test("既定上限を使用する", () => {
    // VITE_MAX_ATTACHMENT_BYTES 上書き時は設定値、未設定時は既定20MiBを使う
    const configured = Number(import.meta.env?.VITE_MAX_ATTACHMENT_BYTES);
    if (Number.isFinite(configured) && configured > 0) {
      expect(MAX_ATTACHMENT_BYTES).toBe(configured);
    } else {
      expect(MAX_ATTACHMENT_BYTES).toBe(DEFAULT_MAX_ATTACHMENT_BYTES);
      expect(MAX_ATTACHMENT_BYTES).toBe(20 * 1024 * 1024);
    }
  });

  test("クライアント上限超過はArrayBuffer化より前に拒否する", async () => {
    let arrayBufferCalled = false;
    const file = {
      size: MAX_ATTACHMENT_BYTES + 1,
      arrayBuffer: (): Promise<ArrayBuffer> => {
        arrayBufferCalled = true;
        return Promise.resolve(new ArrayBuffer(0));
      },
    };

    await expect(readAttachmentForUpload(file)).rejects.toMatchObject({
      code: "ATTACHMENT_TOO_LARGE",
    });
    expect(arrayBufferCalled).toBe(false);
  });

  test("クライアント上限と同じサイズはArrayBuffer化する", async () => {
    let arrayBufferCalled = false;
    const file = {
      size: MAX_ATTACHMENT_BYTES,
      arrayBuffer: (): Promise<ArrayBuffer> => {
        arrayBufferCalled = true;
        return Promise.resolve(new ArrayBuffer(0));
      },
    };

    await expect(readAttachmentForUpload(file)).resolves.toBeInstanceOf(
      ArrayBuffer,
    );
    expect(arrayBufferCalled).toBe(true);
  });
});
