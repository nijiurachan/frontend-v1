import { find, type Opts } from "linkifyjs";

export interface TextSegment {
  type: "text";
  content: string;
}

export interface LinkSegment {
  type: "link";
  content: string;
  href: string;
}

export interface DiceSegment {
  type: "dice";
  prefix: string; // dice2d6=(
  resultValue: string; // 1+5
  suffix: string; // )
}

export type Segment = TextSegment | LinkSegment | DiceSegment;

/** 文中リンク検出時のオプション */
const linkifyOpts: Opts = {
  validate: {
    url: (value: string) => {
      try {
        // プロトコル(http/https)が付いていないドメイン名はリンク化から除外する(例外が出る)
        const url = new URL(value);

        const host = url.hostname.replace(/\.$/, "");
        // localhostは除外
        if (host === "localhost" || host.endsWith(".localhost")) {
          return false;
        }
        // IPv4も除外
        if (/^\d{1,3}(?:\.\d{1,3}){3}$/.test(host)) {
          return false;
        }
        // IPv6も除外
        if (host.includes(":")) {
          return false;
        }
        return url.protocol === "http:" || url.protocol === "https:";
      } catch {
        return false;
      }
    },
  },
};

/**
 * テキストをリンク、ダイス表記、プレーンテキストのセグメントに分割する。
 * URL検出には linkifyjs を使用。
 * ダイス表記の正規表現: dice\d+d\d+[^=]*\s*=[^\(]*\(([^)]+)\)
 */
export function segmentize(text: string): Segment[] {
  if (!text) return [];

  // ダイス表記の正規表現（テキスト内のどこでも検出）
  const diceRegex = /dice\d+d\d+[^=]*\s*=[^(]*\(([^)]+)\)/g;
  const diceMatches = Array.from(text.matchAll(diceRegex));

  // リンクを検出
  const linkMatches = find(text, "url", linkifyOpts);

  // マッチ位置の配列を作成
  const allMatches: Array<{
    start: number;
    end: number;
    type: "link" | "dice";
    match: (typeof linkMatches)[0] | RegExpMatchArray;
  }> = [];

  for (const match of linkMatches) {
    allMatches.push({
      start: match.start,
      end: match.end,
      type: "link",
      match,
    });
  }

  for (const match of diceMatches) {
    allMatches.push({
      start: match.index ?? 0,
      end: (match.index ?? 0) + match[0].length,
      type: "dice",
      match,
    });
  }

  // 位置でソート
  allMatches.sort((a, b) => a.start - b.start);

  const segments: Segment[] = [];
  let cursor = 0;

  for (const item of allMatches) {
    // オーバーラップをチェック（前のマッチの影響を避ける）
    if (item.start < cursor) continue;

    if (item.start > cursor) {
      segments.push({ type: "text", content: text.slice(cursor, item.start) });
    }

    if (item.type === "link") {
      const match = item.match as (typeof linkMatches)[0];
      segments.push({
        type: "link",
        content: match.value,
        href: match.href,
      });
    } else {
      const match = item.match as RegExpMatchArray;
      const fullMatch = match[0];
      const resultValue = match[1]; // キャプチャグループから数式を取得
      const prefixMatch = fullMatch.match(/^dice\d+d\d+[^=]*\s*=[^(]*\(/);
      if (prefixMatch) {
        segments.push({
          type: "dice",
          prefix: prefixMatch[0],
          resultValue,
          suffix: ")",
        });
      }
    }
    cursor = item.end;
  }

  if (cursor < text.length) {
    segments.push({ type: "text", content: text.slice(cursor) });
  }

  return segments;
}
