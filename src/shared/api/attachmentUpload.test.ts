import { describe, expect, test } from "bun:test";
import {
  DEFAULT_MAX_ATTACHMENT_BYTES,
  MAX_ATTACHMENT_BYTES,
  readAttachmentForUpload,
} from "./attachmentUpload";

describe("readAttachmentForUpload", () => {
  test("既定上限を使用する", () => {
    expect(MAX_ATTACHMENT_BYTES).toBe(DEFAULT_MAX_ATTACHMENT_BYTES);
    expect(MAX_ATTACHMENT_BYTES).toBe(20 * 1024 * 1024);
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
