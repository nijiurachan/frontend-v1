import { describe, expect, test } from "bun:test";

const publicRoot: URL = new URL("../public/", import.meta.url);
const policyPages = ["rules.html", "moderation.html"] as const;
const htmlAttributeReference =
  /\b(?:href|src|poster|action)\s*=\s*["']([^"']+)["']/gi;
const markdownReference = /\]\(\s*([^\s)]+)(?:\s+[^)]*)?\)/g;

function internalPath(reference: string): string | null {
  const target = reference.trim();
  if (
    target.length === 0 ||
    target.startsWith("#") ||
    target.startsWith("//") ||
    /^[a-z][a-z\d+.-]*:/i.test(target)
  ) {
    return null;
  }

  const url = new URL(target, "https://static-public.invalid/");
  if (url.origin !== "https://static-public.invalid") return null;
  return decodeURIComponent(url.pathname);
}

function referencedPaths(source: string): string[] {
  const references = [
    ...source.matchAll(htmlAttributeReference),
    ...source.matchAll(markdownReference),
  ];

  return references
    .map(([, reference]) => internalPath(reference))
    .filter((path): path is string => path !== null);
}

function publicFile(pathname: string): Bun.BunFile {
  if (pathname === "/") {
    return Bun.file(new URL("../index.html", publicRoot));
  }

  const relativePath = pathname.slice(1);
  if (relativePath.includes("..")) {
    throw new Error(`public path escapes root: ${pathname}`);
  }
  return Bun.file(new URL(relativePath, publicRoot));
}

describe("static public pages", () => {
  test("policy pages resolve every internal link and asset", async () => {
    const missing: string[] = [];

    for (const page of policyPages) {
      const source = await Bun.file(new URL(page, publicRoot)).text();
      for (const pathname of referencedPaths(source)) {
        if (!(await publicFile(pathname).exists())) {
          missing.push(`${page}: ${pathname}`);
        }
      }
    }

    expect(missing).toEqual([]);
  });

  test("policy pages use the root catalog route and link to each other", async () => {
    const sources = await Promise.all(
      policyPages.map((page) => Bun.file(new URL(page, publicRoot)).text()),
    );
    const [rules, moderation] = sources;

    expect(sources.join("\n")).not.toMatch(/\/pc(?:\/|catalog\.php)/);
    expect(rules).toContain('href="/moderation.html"');
    expect(moderation).toContain('href="/rules.html"');
    expect(rules).toContain("（最大16MB）");
  });

  test("favicon references resolve from index and manifest", async () => {
    const index = await Bun.file(
      new URL("../index.html", import.meta.url),
    ).text();
    const manifest = JSON.parse(
      await Bun.file(new URL("manifest.json", publicRoot)).text(),
    ) as { icons?: { src?: string }[] };

    expect(index).toContain('href="/favicon.png"');
    expect(index).toContain('href="/apple-touch-icon.png"');

    const manifestIcons = manifest.icons ?? [];
    expect(manifestIcons.length).toBeGreaterThan(0);
    for (const icon of manifestIcons) {
      expect(icon.src).toBeDefined();
      const pathname = internalPath(icon.src ?? "");
      expect(pathname).not.toBeNull();
      expect(await publicFile(pathname ?? "").exists()).toBe(true);
    }
  });
});
