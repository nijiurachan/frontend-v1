/**
 * URLがYouTube URLかどうかを判定
 * @param url - チェックするURL
 * @returns YouTubeの場合true
 */
export function isYouTubeUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    return (
      urlObj.hostname === "www.youtube.com" ||
      urlObj.hostname === "youtube.com" ||
      urlObj.hostname === "youtu.be" ||
      urlObj.hostname === "m.youtube.com"
    );
  } catch {
    return false;
  }
}

/**
 * YouTube URLから動画IDを抽出
 * @param url - YouTube URL
 * @returns 動画ID、抽出できない場合null
 */
export function extractYouTubeId(url: string): string | null {
  try {
    const urlObj = new URL(url);

    // youtu.be形式
    if (urlObj.hostname === "youtu.be") {
      const match = urlObj.pathname.match(/^\/([A-Za-z0-9_-]{11})\/?$/);
      return match?.[1] ?? null;
    }

    // youtube.com形式
    if (
      urlObj.hostname === "www.youtube.com" ||
      urlObj.hostname === "youtube.com" ||
      urlObj.hostname === "m.youtube.com"
    ) {
      // /watch?v=VIDEO_ID
      const vParam = urlObj.searchParams.get("v");
      if (vParam && /^[A-Za-z0-9_-]{11}$/.test(vParam)) return vParam;

      // /embed/VIDEO_ID
      const embedMatch = urlObj.pathname.match(
        /^\/(?:embed|shorts|live)\/([A-Za-z0-9_-]{11})\/?$/,
      );
      if (embedMatch) return embedMatch[1];
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * URLがX (Twitter) URLかどうかを判定
 * @param url - チェックするURL
 * @returns X/Twitterの場合true
 */
export function isXUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    return (
      urlObj.hostname === "twitter.com" ||
      urlObj.hostname === "www.twitter.com" ||
      urlObj.hostname === "x.com" ||
      urlObj.hostname === "www.x.com" ||
      urlObj.hostname === "mobile.twitter.com" ||
      urlObj.hostname === "mobile.x.com"
    );
  } catch {
    return false;
  }
}

/**
 * X (Twitter) URLからツイートIDを抽出
 * @param url - X/Twitter URL
 * @returns ツイートID、抽出できない場合null
 */
export function extractXTweetId(url: string): string | null {
  try {
    const urlObj = new URL(url);
    // /username/status/TWEET_ID 形式
    const match = urlObj.pathname.match(/^\/[A-Za-z0-9_]+\/status\/(\d+)\/?$/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}
