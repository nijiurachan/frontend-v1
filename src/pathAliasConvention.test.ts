import { describe, expect, test } from "bun:test";

const relativeModuleSpecifier = /(\b(?:from|import)\s*(?:\(\s*)?)["']\.\.?\//;

describe("source path alias convention", () => {
  test("handwritten src modules do not use relative imports", async () => {
    const violations: string[] = [];
    const glob = new Bun.Glob("**/*.{ts,tsx}");

    for await (const path of glob.scan({ cwd: import.meta.dir })) {
      if (path.endsWith("/index.ts") || path.endsWith(".gen.ts")) continue;
      const source = await Bun.file(new URL(path, import.meta.url)).text();
      if (relativeModuleSpecifier.test(source)) violations.push(path);
    }

    expect(violations).toEqual([]);
  });
});
