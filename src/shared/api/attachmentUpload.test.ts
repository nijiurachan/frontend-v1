import { describe, expect, test } from "bun:test";
import { readAttachmentForUpload } from "./attachmentUpload";

describe("readAttachmentForUpload", () => {
  test("サーバー上限を仮定せず大きなファイルもArrayBuffer化する", async () => {
    let arrayBufferCalled = false;
    const file = {
      size: 20 * 1024 * 1024 + 1,
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
