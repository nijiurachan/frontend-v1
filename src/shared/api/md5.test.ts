import { describe, expect, test } from "bun:test";
import { md5 } from "./md5";

const digest = (value: string): Promise<string> =>
  md5(new TextEncoder().encode(value).buffer);

describe("md5", () => {
  test("matches standard vectors", async () => {
    await expect(digest("")).resolves.toBe("d41d8cd98f00b204e9800998ecf8427e");
    await expect(digest("abc")).resolves.toBe(
      "900150983cd24fb0d6963f7d28e17f72",
    );
  });
});
