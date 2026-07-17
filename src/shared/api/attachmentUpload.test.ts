import { describe, expect, test } from "bun:test";
import {
  MAX_ATTACHMENT_SIZE_BYTES,
  readAttachmentWithinLimit,
} from "./attachmentUpload";

describe("readAttachmentWithinLimit", () => {
  test("backend上限超過はArrayBuffer化より前に拒否する", async () => {
    let arrayBufferCalled = false;
    const file = {
      size: MAX_ATTACHMENT_SIZE_BYTES + 1,
      arrayBuffer: (): Promise<ArrayBuffer> => {
        arrayBufferCalled = true;
        return Promise.resolve(new ArrayBuffer(0));
      },
    };

    await expect(readAttachmentWithinLimit(file)).rejects.toMatchObject({
      code: "ATTACHMENT_TOO_LARGE",
    });
    expect(arrayBufferCalled).toBe(false);
  });

  test("backend上限と同じサイズは許可する", async () => {
    let arrayBufferCalled = false;
    const file = {
      size: MAX_ATTACHMENT_SIZE_BYTES,
      arrayBuffer: (): Promise<ArrayBuffer> => {
        arrayBufferCalled = true;
        return Promise.resolve(new ArrayBuffer(0));
      },
    };

    await expect(readAttachmentWithinLimit(file)).resolves.toBeInstanceOf(
      ArrayBuffer,
    );
    expect(arrayBufferCalled).toBe(true);
  });
});
