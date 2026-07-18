import { describe, expect, test } from "bun:test";
import {
  buildExternalIframe,
  detectExternalProvider,
  previewKind,
} from "@/features/thread/utils/externalProvider";

describe("detectExternalProvider", () => {
  test.each([
    ["youtube", "https://www.youtube.com/watch?v=dQw4w9WgXcQ"],
    ["youtube", "https://youtu.be/dQw4w9WgXcQ?t=1"],
    ["youtube", "https://youtube.com/shorts/dQw4w9WgXcQ"],
    ["youtube", "https://youtube.com/live/dQw4w9WgXcQ"],
    ["x", "https://x.com/example/status/1234567890"],
    ["x", "https://twitter.com/example/status/1234567890?s=20"],
    ["instagram", "https://www.instagram.com/p/AbC_123-/"],
    ["instagram", "https://instagram.com/reels/AbC_123-/"],
    ["tiktok", "https://www.tiktok.com/@creator/video/1234567890123456789"],
    ["tiktok", "https://vm.tiktok.com/ZMabc123/"],
    ["nicovideo", "https://www.nicovideo.jp/watch/sm12345"],
    ["nicovideo", "https://nico.ms/nm987"],
    ["nicovideo", "https://nico.ms/so42"],
    ["spotify", "https://open.spotify.com/track/4abcDEF123"],
    ["spotify", "https://open.spotify.com/album/4abcDEF123"],
    ["spotify", "https://open.spotify.com/playlist/4abcDEF123"],
    ["spotify", "https://open.spotify.com/episode/4abcDEF123"],
    ["soundcloud", "https://soundcloud.com/artist-name/track-name"],
    ["twitch", "https://www.twitch.tv/channel_name"],
    ["twitch", "https://www.twitch.tv/videos/123456"],
    ["twitch", "https://www.twitch.tv/channel_name/clip/Clip_Id-1"],
    ["twitch", "https://clips.twitch.tv/Clip_Id-1"],
    ["pixiv", "https://www.pixiv.net/artworks/12345"],
    ["pixiv", "https://www.pixiv.net/en/artworks/12345"],
    [
      "pixiv",
      "https://www.pixiv.net/member_illust.php?mode=medium&illust_id=12345",
    ],
    ["reddit", "https://www.reddit.com/r/typescript/comments/abc123/title/"],
    ["reddit", "https://redd.it/abc123"],
  ])("detects %s from %s", (provider, url) => {
    expect(detectExternalProvider(url)?.provider).toBe(provider);
  });

  test.each([
    "https://youtube.com.evil.test/watch?v=dQw4w9WgXcQ",
    "https://evil.test/?next=https://x.com/user/status/123",
    "https://instagram.com.evil.test/p/AbC123/",
    "https://evil.tiktok.com/@user/video/123",
    "https://nicovideo.jp.evil.test/watch/sm123",
    "https://open.spotify.com.evil.test/track/abc",
    "https://soundcloud.com.evil.test/user/track",
    "https://twitch.tv.evil.test/channel",
    "https://pixiv.net.evil.test/artworks/123",
    "https://reddit.com.evil.test/r/test/comments/abc/title",
  ])("rejects spoofed hosts: %s", (url) => {
    expect(detectExternalProvider(url)).toBeNull();
  });

  test.each([
    "https://youtube.com/watch?v=too-short",
    "https://x.com/user/status/not-digits",
    "https://instagram.com/p/",
    "https://www.tiktok.com/@user/video/not-digits",
    "https://vm.tiktok.com/code-with-dash/",
    "https://nico.ms/smABC",
    "https://open.spotify.com/show/abc",
    "https://soundcloud.com/only-user",
    "https://twitch.tv/videos/not-digits",
    "https://pixiv.net/artworks/not-digits",
    "https://redd.it/not-valid-id!",
    "javascript:alert(1)",
  ])("rejects malformed provider URLs: %s", (url) => {
    expect(detectExternalProvider(url)).toBeNull();
  });

  test("keeps dedicated providers independent from the generic OGP toggle", () => {
    expect(previewKind("https://nico.ms/sm123", false)).toBe("dedicated");
    expect(previewKind("https://example.test/article", false)).toBe("none");
    expect(previewKind("https://example.test/article", true)).toBe("ogp");
  });

  test("builds iframe src only from allowlisted URL parts", () => {
    const spotify = detectExternalProvider(
      "https://open.spotify.com/playlist/abc123",
    );
    const twitch = detectExternalProvider("https://twitch.tv/videos/42");
    const soundcloud = detectExternalProvider(
      "https://soundcloud.com/user/track?utm_source=test",
    );
    expect(spotify && buildExternalIframe(spotify, "board.example")?.src).toBe(
      "https://open.spotify.com/embed/playlist/abc123?utm_source=generator&theme=0",
    );
    expect(twitch && buildExternalIframe(twitch, "board.example")?.src).toBe(
      "https://player.twitch.tv/?video=42&parent=board.example&autoplay=false",
    );
    expect(
      soundcloud && buildExternalIframe(soundcloud, "board.example")?.src,
    ).toContain("url=https%3A%2F%2Fsoundcloud.com%2Fuser%2Ftrack");
  });
});
