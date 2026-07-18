interface Env {
  ASSETS: { fetch(request: Request): Promise<Response> };
  PUBLIC_SITE_URL?: string;
}

interface SitemapPage {
  items: Array<{ threadId: string; archivedAt: string }>;
  nextCursor: string | null;
}

const SITEMAP_PAGE_SIZE = 500;
const SITEMAP_MAX_THREADS = 50_000;

const xml = (value: string): string =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

export function parsePublicSiteUrl(value: string | undefined): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    if (
      url.protocol !== "https:" ||
      url.username !== "" ||
      url.password !== "" ||
      url.pathname !== "/" ||
      url.search !== "" ||
      url.hash !== ""
    ) {
      return null;
    }
    return url.origin;
  } catch {
    return null;
  }
}

export async function createSitemap(
  origin: string,
  fetcher: typeof fetch = fetch,
): Promise<string> {
  const threads: SitemapPage["items"] = [];
  const seenCursors = new Set<string>();
  let cursor: string | null = null;
  do {
    const query = new URLSearchParams({ limit: String(SITEMAP_PAGE_SIZE) });
    if (cursor) query.set("cursor", cursor);
    const response = await fetcher(
      `${origin}/api/sitemap/threads?${query.toString()}`,
      { headers: { accept: "application/json" } },
    );
    if (!response.ok) throw new Error(`sitemap data ${response.status}`);
    const data = (await response.json()) as SitemapPage;
    const remaining = SITEMAP_MAX_THREADS - threads.length;
    threads.push(...data.items.slice(0, remaining));
    if (threads.length >= SITEMAP_MAX_THREADS || data.nextCursor === null) {
      cursor = null;
    } else if (seenCursors.has(data.nextCursor)) {
      throw new Error("repeated sitemap cursor");
    } else {
      seenCursors.add(data.nextCursor);
      cursor = data.nextCursor;
    }
  } while (cursor !== null);

  const urls = [
    `<url><loc>${xml(`${origin}/archive`)}</loc><changefreq>hourly</changefreq></url>`,
    ...threads.map(
      (thread) =>
        `<url><loc>${xml(`${origin}/thread/${encodeURIComponent(thread.threadId)}`)}</loc><lastmod>${xml(thread.archivedAt)}</lastmod></url>`,
    ),
  ].join("");
  return `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (
      (url.pathname === "/robots.txt" || url.pathname === "/sitemap.xml") &&
      request.method !== "GET" &&
      request.method !== "HEAD"
    ) {
      return new Response("Method Not Allowed", {
        status: 405,
        headers: { allow: "GET, HEAD" },
      });
    }
    const origin = parsePublicSiteUrl(env.PUBLIC_SITE_URL);
    if (url.pathname === "/robots.txt") {
      if (!origin) return new Response("unavailable", { status: 503 });
      return new Response(
        `User-agent: *\nDisallow: /__admin_/\nDisallow: /api/\n\nSitemap: ${origin}/sitemap.xml\n`,
        { headers: { "content-type": "text/plain; charset=utf-8" } },
      );
    }
    if (url.pathname === "/sitemap.xml") {
      if (!origin) return new Response("unavailable", { status: 503 });
      try {
        return new Response(await createSitemap(origin), {
          headers: {
            "content-type": "application/xml; charset=utf-8",
            "cache-control": "public, max-age=3600",
          },
        });
      } catch {
        return new Response("sitemap unavailable", { status: 503 });
      }
    }
    return env.ASSETS.fetch(request);
  },
};
