// ============================================================
// features/player/utils/providerDetect.ts
// URL からプロバイダーとIDを判定する
// ============================================================

import type { Provider } from "@/features/player/stores/playerStore";

// ----------------------------------------------------------
// パターン定義
// ----------------------------------------------------------

interface ProviderPattern {
  provider: Provider;
  /** URL全体にマッチする正規表現 */
  pattern: RegExp;
  /** マッチ結果からプロバイダー固有IDを抽出（グループ1を使用） */
  extractId: (match: RegExpMatchArray) => string | null;
}

const PROVIDER_PATTERNS: ProviderPattern[] = [
  // YouTube: 通常URL, 短縮URL, embed
  {
    provider: "youtube",
    pattern:
      /(?:youtube\.com\/(?:watch\?.*v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/,
    extractId: (m: RegExpMatchArray): string | null => m[1] ?? null,
  },
  // Twitch: clips.twitch.tv 形式（先に評価）
  {
    provider: "twitch",
    pattern: /clips\.twitch\.tv\/([\w-]+)/,
    extractId: (m: RegExpMatchArray): string | null =>
      m[1] ? `clip:${m[1]}` : null,
  },
  // Twitch: チャンネル, クリップ, VOD
  {
    provider: "twitch",
    pattern: /twitch\.tv\/(?:videos\/(\d+)|(\w+)(?:\/clip\/(\w+))?)/,
    extractId: (m: RegExpMatchArray): string | null => {
      if (m[1]) return `video:${m[1]}`;
      if (m[3]) return `clip:${m[3]}`;
      if (m[2]) return `channel:${m[2]}`;
      return null;
    },
  },
  // ニコニコ動画
  {
    provider: "nicovideo",
    pattern: /nicovideo\.jp\/watch\/(sm\d+)/,
    extractId: (m: RegExpMatchArray): string | null => m[1] ?? null,
  },
  // サイト内動画（拡張子ベース）
  {
    provider: "internal",
    pattern: /\.(mp4|webm)(\?.*)?$/i,
    extractId: (_m: RegExpMatchArray, url?: string): string | null =>
      url ?? null,
  },
  // 外部音楽サービス（SoundCloud等、将来拡張用）
  {
    provider: "external_audio",
    pattern: /soundcloud\.com\/([\w-]+\/[\w-]+)/,
    extractId: (m: RegExpMatchArray): string | null => m[1] ?? null,
  },
];

// ----------------------------------------------------------
// 公開API
// ----------------------------------------------------------

/**
 * URL からプロバイダーを判定する
 * @returns 対応プロバイダー or null（非対応URL）
 */
export function detectProvider(url: string): Provider | null {
  for (const { provider, pattern } of PROVIDER_PATTERNS) {
    if (pattern.test(url)) {
      return provider;
    }
  }
  return null;
}

/**
 * URL からプロバイダー固有IDを抽出する
 * @param url 対象URL
 * @param provider 判定済みプロバイダー（省略時は自動判定）
 * @returns プロバイダー固有ID or null
 */
export function extractProviderId(
  url: string,
  provider?: Provider,
): string | null {
  const targetProvider = provider ?? detectProvider(url);
  if (!targetProvider) return null;

  for (const entry of PROVIDER_PATTERNS) {
    if (entry.provider !== targetProvider) continue;

    const match = url.match(entry.pattern);
    if (!match) continue;

    // internal の場合は URL 自体を ID とする
    if (entry.provider === "internal") {
      return url;
    }

    return entry.extractId(match);
  }

  return null;
}

/**
 * URL がライブ配信かどうかの推定
 * （確実な判定にはAPIが必要だが、URLパターンでの簡易判定）
 */
export function isLikelyLive(url: string): boolean {
  const provider = detectProvider(url);
  if (!provider) return false;

  // Twitch のチャンネルURL（VOD/clipでない）はライブの可能性が高い
  if (provider === "twitch") {
    if (/clips\.twitch\.tv/.test(url)) return false;
    return !/\/(videos|clip)\//.test(url);
  }

  // YouTube Live は URL だけでは判定困難
  // → 将来的に OGP or YouTube API で判定
  return false;
}

/**
 * URL から同時視聴パラメータ `&douji=YYYYMMDDHHmm` を抽出する
 * @returns JST基準の Date オブジェクト or null
 */
export function extractDoujiTime(url: string): Date | null {
  const match = url.match(/[?&]douji=(\d{12})/);
  if (!match?.[1]) return null;

  const raw = match[1];
  const year = Number(raw.slice(0, 4));
  const month = Number(raw.slice(4, 6)) - 1; // 0-indexed
  const day = Number(raw.slice(6, 8));
  const hour = Number(raw.slice(8, 10));
  const minute = Number(raw.slice(10, 12));

  // 入力値の基本範囲チェック（Date.UTC の正規化による偽陽性を防止）
  if (
    month < 0 ||
    month > 11 ||
    day < 1 ||
    day > 31 ||
    hour > 23 ||
    minute > 59
  ) {
    return null;
  }

  // JST (UTC+9) → UTC に変換して Date を生成
  const jstDate = new Date(Date.UTC(year, month, day, hour - 9, minute));

  if (Number.isNaN(jstDate.getTime())) return null;
  return jstDate;
}

/** PlayerTrigger が必要とする URL 分析結果 */
export interface UrlAnalysis {
  /** 対応プロバイダー（null = 非対応URL） */
  provider: Provider | null;
  /** プロバイダー固有ID */
  providerId: string | null;
  /** ライブ配信の可能性 */
  isLive: boolean;
  /** 同時視聴開始時刻（JST由来、null = 同時視聴なし） */
  doujiTime: Date | null;
  /** 同時視聴オプションが付いているか */
  hasDouji: boolean;
}

/**
 * URL をまとめて分析し、PlayerTrigger に必要な情報をすべて返す
 * PlayerTrigger はこれ1つ呼ぶだけでボタン構成を決定できる
 */
export function analyzeUrl(url: string): UrlAnalysis {
  const provider = detectProvider(url);
  const providerId = provider ? extractProviderId(url, provider) : null;
  const isLive = isLikelyLive(url);
  const doujiTime = extractDoujiTime(url);

  return {
    provider,
    providerId,
    isLive,
    doujiTime,
    hasDouji: doujiTime !== null,
  };
}
