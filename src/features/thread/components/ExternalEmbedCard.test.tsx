import { describe, expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { ExternalEmbedCard } from "@/features/thread/components/ExternalEmbedCard";
import { detectExternalProvider } from "@/features/thread/utils/externalProvider";
import { createOfficialEmbedScriptLoader } from "@/features/thread/utils/officialEmbedScript";

describe("ExternalEmbedCard", () => {
  test.each([
    "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    "https://nico.ms/sm123",
    "https://open.spotify.com/track/abc123",
    "https://soundcloud.com/user/track",
    "https://twitch.tv/videos/42",
    "https://vm.tiktok.com/ZMabc123/",
  ])(
    "renders safe iframe attributes and an operable source link for %s",
    (url) => {
      const match = detectExternalProvider(url);
      expect(match).not.toBeNull();
      if (!match) throw new Error("provider fixture did not match");
      const html = renderToStaticMarkup(
        <ExternalEmbedCard match={match} parentHostname="board.example" />,
      );
      expect(html).toContain("<iframe");
      expect(html).toContain("title=");
      expect(html).toContain(
        'referrerPolicy="strict-origin-when-cross-origin"',
      );
      expect(html).toContain("allow=");
      expect(html).toContain('rel="noopener noreferrer"');
    },
  );

  test.each([
    "https://instagram.com/p/AbC123/",
    "https://www.tiktok.com/@creator/video/123456789",
    "https://pixiv.net/artworks/123",
    "https://redd.it/abc123",
    "https://x.com/user/status/123456",
  ])("keeps a safe fallback link for script and link cards: %s", (url) => {
    const match = detectExternalProvider(url);
    if (!match) throw new Error("provider fixture did not match");
    const html = renderToStaticMarkup(<ExternalEmbedCard match={match} />);
    expect(html).toContain('target="_blank"');
    expect(html).toContain('rel="noopener noreferrer"');
    expect(html).toContain(url.replaceAll("&", "&amp;"));
  });

  test("loads an official script once and processes again on re-render", async () => {
    let appended = 0;
    let processed = 0;
    const scripts: Array<{
      onload: null | (() => void);
      onerror: null | (() => void);
    }> = [];
    const fakeDocument = {
      createElement: () => {
        const script = { onload: null, onerror: null, dataset: {} };
        scripts.push(script);
        return script;
      },
      head: {
        appendChild: (script: (typeof scripts)[number]) => {
          appended += 1;
          queueMicrotask(() => script.onload?.());
        },
      },
    } as unknown as Document;
    const fakeWindow = {
      instgrm: {
        Embeds: {
          process: () => {
            processed += 1;
          },
        },
      },
    } as unknown as Window;
    const load = createOfficialEmbedScriptLoader();

    await Promise.all([
      load("instagram", fakeDocument, fakeWindow),
      load("instagram", fakeDocument, fakeWindow),
    ]);
    await load("instagram", fakeDocument, fakeWindow);

    expect(appended).toBe(1);
    expect(processed).toBeGreaterThanOrEqual(2);
  });

  test("rejects script failures while the card fallback remains independent", async () => {
    const fakeDocument = {
      createElement: () => ({ onload: null, onerror: null, dataset: {} }),
      head: {
        appendChild: (script: { onerror: null | (() => void) }) =>
          queueMicrotask(() => script.onerror?.()),
      },
    } as unknown as Document;
    const load = createOfficialEmbedScriptLoader();
    await expect(load("tiktok", fakeDocument, {} as Window)).rejects.toThrow();
  });
});
