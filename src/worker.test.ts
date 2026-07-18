import { describe, expect, test } from "bun:test";
import worker, { createSitemap, parsePublicSiteUrl } from "@/worker";

describe("sitemap worker", () => {
  test("pages through the bounded backend cursor contract", async () => {
    const requested: string[] = [];
    const fetcher = (async (input: URL | RequestInfo) => {
      const url = String(input);
      requested.push(url);
      return Response.json(
        url.includes("cursor=next")
          ? {
              items: [
                {
                  threadId: "uuid-2",
                  archivedAt: "2026-01-02T00:00:00Z",
                },
              ],
              nextCursor: null,
            }
          : {
              items: [
                {
                  threadId: "uuid-1",
                  archivedAt: "2026-01-01T00:00:00Z",
                },
              ],
              nextCursor: "next",
            },
      );
    }) as typeof fetch;
    const sitemap = await createSitemap("https://example.test", fetcher);
    expect(sitemap).toContain("https://example.test/archive");
    expect(sitemap).toContain("https://example.test/thread/uuid-1");
    expect(sitemap).toContain("https://example.test/thread/uuid-2");
    expect(requested).toHaveLength(2);
    expect(requested[0]).toContain("/api/sitemap/threads?limit=500");
    expect(requested[1]).toContain("cursor=next");
  });

  test("rejects unsafe public origins and request Host injection", async () => {
    expect(parsePublicSiteUrl("javascript:alert(1)")).toBeNull();
    expect(parsePublicSiteUrl("https://user:pass@example.test")).toBeNull();
    expect(parsePublicSiteUrl("https://example.test/path")).toBeNull();
    const response = await worker.fetch(
      new Request("https://evil.example/robots.txt"),
      {
        PUBLIC_SITE_URL: "https://nijiurachan.net",
        ASSETS: { fetch: async () => new Response("asset") },
      },
    );
    expect(await response.text()).toContain(
      "Sitemap: https://nijiurachan.net/sitemap.xml",
    );
  });
});
