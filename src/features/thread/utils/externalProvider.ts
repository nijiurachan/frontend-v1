import {
  extractXTweetId,
  extractYouTubeId,
  isXUrl,
  isYouTubeUrl,
} from "@/shared/lib/linkUtils";

export type ExternalProvider =
  | "youtube"
  | "x"
  | "instagram"
  | "tiktok"
  | "nicovideo"
  | "spotify"
  | "soundcloud"
  | "twitch"
  | "pixiv"
  | "reddit";

interface ExternalMatchBase {
  provider: ExternalProvider;
  originalUrl: string;
  canonicalUrl: string;
}

export type ExternalProviderMatch =
  | (ExternalMatchBase & {
      provider: "youtube" | "x" | "nicovideo" | "pixiv";
      id: string;
    })
  | (ExternalMatchBase & {
      provider: "instagram";
      id: string;
      mediaType: "p" | "reel" | "reels";
    })
  | (ExternalMatchBase & {
      provider: "tiktok";
      id: string;
      mediaType: "video" | "short";
    })
  | (ExternalMatchBase & {
      provider: "spotify";
      id: string;
      mediaType: "track" | "album" | "playlist" | "episode";
    })
  | (ExternalMatchBase & { provider: "soundcloud" })
  | (ExternalMatchBase & {
      provider: "twitch";
      id: string;
      mediaType: "channel" | "video" | "clip";
    })
  | (ExternalMatchBase & {
      provider: "reddit";
      id: string;
      subreddit: string | null;
    });

export interface ExternalIframe {
  src: string;
  title: string;
  allow: string;
  height: "video" | "compact" | "tall";
  allowFullScreen: boolean;
}

const safeHost = (url: URL, hosts: readonly string[]): boolean =>
  hosts.includes(url.hostname.toLowerCase());

function parseWebUrl(rawUrl: string): URL | null {
  try {
    const url = new URL(rawUrl);
    if (!["http:", "https:"].includes(url.protocol)) return null;
    if (url.username || url.password) return null;
    return url;
  } catch {
    return null;
  }
}

export function detectExternalProvider(
  rawUrl: string,
): ExternalProviderMatch | null {
  const url = parseWebUrl(rawUrl);
  if (!url) return null;

  if (isYouTubeUrl(rawUrl)) {
    const id = extractYouTubeId(rawUrl);
    if (id && /^[A-Za-z0-9_-]{11}$/.test(id)) {
      return {
        provider: "youtube",
        id,
        originalUrl: rawUrl,
        canonicalUrl: `https://www.youtube.com/watch?v=${id}`,
      };
    }
  }

  if (isXUrl(rawUrl)) {
    const id = extractXTweetId(rawUrl);
    if (id) {
      return {
        provider: "x",
        id,
        originalUrl: rawUrl,
        canonicalUrl: `https://x.com/i/status/${id}`,
      };
    }
  }

  if (safeHost(url, ["instagram.com", "www.instagram.com"])) {
    const match = url.pathname.match(/^\/(p|reel|reels)\/([A-Za-z0-9_-]+)\/?$/);
    if (match?.[1] && match[2]) {
      const mediaType = match[1] as "p" | "reel" | "reels";
      return {
        provider: "instagram",
        id: match[2],
        mediaType,
        originalUrl: rawUrl,
        canonicalUrl: `https://www.instagram.com/${mediaType}/${match[2]}/`,
      };
    }
  }

  if (safeHost(url, ["tiktok.com", "www.tiktok.com", "m.tiktok.com"])) {
    const match = url.pathname.match(/^\/@[A-Za-z0-9._-]+\/video\/(\d+)\/?$/);
    if (match?.[1]) {
      return {
        provider: "tiktok",
        id: match[1],
        mediaType: "video",
        originalUrl: rawUrl,
        canonicalUrl: `https://www.tiktok.com${url.pathname.replace(/\/$/, "")}`,
      };
    }
  }

  if (safeHost(url, ["vm.tiktok.com"])) {
    const match = url.pathname.match(/^\/([A-Za-z0-9]+)\/?$/);
    if (match?.[1]) {
      return {
        provider: "tiktok",
        id: match[1],
        mediaType: "short",
        originalUrl: rawUrl,
        canonicalUrl: `https://vm.tiktok.com/${match[1]}/`,
      };
    }
  }

  if (
    safeHost(url, [
      "nicovideo.jp",
      "www.nicovideo.jp",
      "sp.nicovideo.jp",
      "nico.ms",
    ])
  ) {
    const match = safeHost(url, ["nico.ms"])
      ? url.pathname.match(/^\/((?:sm|nm|so)\d+)\/?$/)
      : url.pathname.match(/^\/watch\/((?:sm|nm|so)\d+)\/?$/);
    if (match?.[1]) {
      return {
        provider: "nicovideo",
        id: match[1],
        originalUrl: rawUrl,
        canonicalUrl: `https://www.nicovideo.jp/watch/${match[1]}`,
      };
    }
  }

  if (safeHost(url, ["open.spotify.com"])) {
    const match = url.pathname.match(
      /^\/(track|album|playlist|episode)\/([A-Za-z0-9]+)\/?$/,
    );
    if (match?.[1] && match[2]) {
      const mediaType = match[1] as "track" | "album" | "playlist" | "episode";
      return {
        provider: "spotify",
        id: match[2],
        mediaType,
        originalUrl: rawUrl,
        canonicalUrl: `https://open.spotify.com/${mediaType}/${match[2]}`,
      };
    }
  }

  if (safeHost(url, ["soundcloud.com", "www.soundcloud.com"])) {
    if (
      /^\/[A-Za-z0-9_-]+\/[A-Za-z0-9_-]+(?:\/[A-Za-z0-9_-]+)*\/?$/.test(
        url.pathname,
      )
    ) {
      return {
        provider: "soundcloud",
        originalUrl: rawUrl,
        canonicalUrl: `https://soundcloud.com${url.pathname.replace(/\/$/, "")}`,
      };
    }
  }

  if (safeHost(url, ["clips.twitch.tv"])) {
    const match = url.pathname.match(/^\/([A-Za-z0-9_-]+)\/?$/);
    if (match?.[1]) {
      return {
        provider: "twitch",
        id: match[1],
        mediaType: "clip",
        originalUrl: rawUrl,
        canonicalUrl: `https://clips.twitch.tv/${match[1]}`,
      };
    }
  }

  if (safeHost(url, ["twitch.tv", "www.twitch.tv", "m.twitch.tv"])) {
    const video = url.pathname.match(/^\/videos\/(\d+)\/?$/);
    const clip = url.pathname.match(
      /^\/[A-Za-z0-9_]+\/clip\/([A-Za-z0-9_-]+)\/?$/,
    );
    const channel = url.pathname.match(/^\/([A-Za-z0-9_]+)\/?$/);
    if (video?.[1]) {
      return twitchMatch(rawUrl, "video", video[1]);
    }
    if (clip?.[1]) {
      return twitchMatch(rawUrl, "clip", clip[1]);
    }
    if (channel?.[1] && channel[1].toLowerCase() !== "videos") {
      return twitchMatch(rawUrl, "channel", channel[1]);
    }
  }

  if (safeHost(url, ["pixiv.net", "www.pixiv.net"])) {
    const artwork = url.pathname.match(/^\/(?:[a-z]{2}\/)?artworks\/(\d+)\/?$/);
    const legacy =
      url.pathname === "/member_illust.php"
        ? url.searchParams.get("illust_id")
        : null;
    const id = artwork?.[1] ?? (legacy && /^\d+$/.test(legacy) ? legacy : null);
    if (id) {
      return {
        provider: "pixiv",
        id,
        originalUrl: rawUrl,
        canonicalUrl: `https://www.pixiv.net/artworks/${id}`,
      };
    }
  }

  if (
    safeHost(url, [
      "reddit.com",
      "www.reddit.com",
      "old.reddit.com",
      "m.reddit.com",
    ])
  ) {
    const match = url.pathname.match(
      /^\/r\/([A-Za-z0-9_]+)\/comments\/([A-Za-z0-9]+)(?:\/[^?#]*)?$/,
    );
    if (match?.[1] && match[2]) {
      return {
        provider: "reddit",
        id: match[2],
        subreddit: match[1],
        originalUrl: rawUrl,
        canonicalUrl: `https://www.reddit.com/r/${match[1]}/comments/${match[2]}/`,
      };
    }
  }

  if (safeHost(url, ["redd.it"])) {
    const match = url.pathname.match(/^\/([A-Za-z0-9]+)\/?$/);
    if (match?.[1]) {
      return {
        provider: "reddit",
        id: match[1],
        subreddit: null,
        originalUrl: rawUrl,
        canonicalUrl: `https://redd.it/${match[1]}`,
      };
    }
  }

  return null;
}

function twitchMatch(
  originalUrl: string,
  mediaType: "channel" | "video" | "clip",
  id: string,
): ExternalProviderMatch {
  const path =
    mediaType === "channel"
      ? id
      : mediaType === "video"
        ? `videos/${id}`
        : `clip/${id}`;
  return {
    provider: "twitch",
    mediaType,
    id,
    originalUrl,
    canonicalUrl: `https://www.twitch.tv/${path}`,
  };
}

export function previewKind(
  url: string,
  genericOgpEnabled: boolean,
): "dedicated" | "ogp" | "none" {
  if (detectExternalProvider(url)) return "dedicated";
  return genericOgpEnabled ? "ogp" : "none";
}

export function buildExternalIframe(
  match: ExternalProviderMatch,
  parentHostname: string,
): ExternalIframe | null {
  const full = "autoplay; fullscreen; picture-in-picture";
  switch (match.provider) {
    case "youtube":
      return iframe(
        `https://www.youtube-nocookie.com/embed/${match.id}?origin=${encodeURIComponent(`https://${safeParent(parentHostname)}`)}&enablejsapi=1`,
        "YouTube video",
        "autoplay; encrypted-media; picture-in-picture",
        "video",
        true,
      );
    case "tiktok":
      return match.mediaType === "short"
        ? iframe(
            `https://vm.tiktok.com/${match.id}/`,
            "TikTok video",
            "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture",
            "tall",
            true,
          )
        : null;
    case "nicovideo":
      return iframe(
        `https://embed.nicovideo.jp/watch/${match.id}`,
        "ニコニコ動画",
        "autoplay; fullscreen",
        "video",
        true,
      );
    case "spotify": {
      const params = new URLSearchParams({
        utm_source: "generator",
        theme: "0",
      });
      return iframe(
        `https://open.spotify.com/embed/${match.mediaType}/${match.id}?${params}`,
        `Spotify ${match.mediaType}`,
        "autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture",
        match.mediaType === "track" || match.mediaType === "episode"
          ? "compact"
          : "tall",
        true,
      );
    }
    case "soundcloud": {
      const params = new URLSearchParams({
        url: match.canonicalUrl,
        color: "#ff5500",
        auto_play: "false",
        hide_related: "false",
        show_comments: "true",
        show_user: "true",
        show_reposts: "false",
        show_teaser: "true",
        visual: "true",
      });
      return iframe(
        `https://w.soundcloud.com/player/?${params}`,
        "SoundCloud audio",
        "autoplay",
        "compact",
        false,
      );
    }
    case "twitch": {
      const params = new URLSearchParams({
        [match.mediaType]: match.id,
        parent: safeParent(parentHostname),
        autoplay: "false",
      });
      const host =
        match.mediaType === "clip"
          ? "https://clips.twitch.tv/embed"
          : "https://player.twitch.tv/";
      return iframe(
        `${host}?${params}`,
        `Twitch ${match.mediaType}`,
        full,
        "video",
        true,
      );
    }
    default:
      return null;
  }
}

function safeParent(hostname: string): string {
  return /^[A-Za-z0-9.-]+$/.test(hostname) ? hostname : "localhost";
}

function iframe(
  src: string,
  title: string,
  allow: string,
  height: ExternalIframe["height"],
  allowFullScreen: boolean,
): ExternalIframe {
  return { src, title, allow, height, allowFullScreen };
}
