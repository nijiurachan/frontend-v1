import { extractLinks } from "./extractLinks";

/**
 * 本文セグメントの型
 */
export type BodySegment =
  | { type: "text"; content: string }
  | { type: "link"; content: string }
  | { type: "quote"; content: string };

/**
 * パース済み本文の型
 */
export interface ParsedBody {
  /** 本文のセグメント配列 */
  segments: BodySegment[];
  /** 抽出されたURL一覧 */
  links: string[];
}

/**
 * HTMLタグを除去してプレーンテキストに変換する
 * @param html - HTML文字列
 * @returns プレーンテキスト
 */
function stripHtmlTags(html: string): string {
  return html.replace(/<[^>]+>/g, "");
}

/**
 * テキストとリンクを解析する
 * @param input - 入力文字列
 * @returns テキストとリンクの配列
 */
export const parseTextAndLinks = (input: string): BodySegment[] => {
  const re = /\bhttps?:\/\/[^\s<>"']+/g;

  const init: { pos: number; out: BodySegment[] } = { pos: 0, out: [] };

  const state = [...input.matchAll(re)].reduce((st, m) => {
    const start = m.index ?? 0;
    const rawAll = m[0];

    const before: BodySegment[] =
      start > st.pos
        ? [{ type: "text", content: input.slice(st.pos, start) }]
        : [];

    const { urlPart, suffix } = stripTrailingPunct(rawAll);

    const middle: BodySegment[] = isValidHttpUrl(urlPart)
      ? [
          { type: "link", content: urlPart },
          ...(suffix ? [{ type: "text" as const, content: suffix }] : []),
        ]
      : [{ type: "text", content: rawAll }];

    return {
      pos: start + rawAll.length,
      out: [...st.out, ...before, ...middle],
    };
  }, init);

  const tail: BodySegment[] =
    state.pos < input.length
      ? [{ type: "text", content: input.slice(state.pos) }]
      : [];

  return mergeAdjacentText([...state.out, ...tail]);
};

// ---- 純粋ヘルパー群（副作用なし） ----

export const isValidHttpUrl = (s: string): boolean => {
  try {
    const u = new URL(s);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
};

export const stripTrailingPunct = (
  s: string,
): { urlPart: string; suffix: string } => {
  const trailing = new Set([
    ")",
    "]",
    "}",
    ">",
    ",",
    ".",
    "!",
    "?",
    ";",
    ":",
    "、",
    "。",
    "！",
    "？",
    "）",
    "］",
    "｝",
    "»",
    "”",
    "’",
  ]);

  const end =
    [...s]
      .map((_, i) => s.length - i) // 後ろから走査
      .find((idx) => idx === 0 || !trailing.has(s[idx - 1])) ?? s.length;

  return { urlPart: s.slice(0, end), suffix: s.slice(end) };
};

export const mergeAdjacentText = (nodes: BodySegment[]): BodySegment[] =>
  nodes.reduce((acc: BodySegment[], node: BodySegment) => {
    const last = acc[acc.length - 1];
    if (node.type === "text" && last?.type === "text") {
      // 不変更新
      return [
        ...acc.slice(0, -1),
        { ...last, content: last.content + node.content },
      ];
    }
    // biome-ignore lint/performance/noAccumulatingSpread: モジュールごと置き換え予定
    return [...acc, node];
  }, []);

/**
 * 投稿本文をパースしてセグメント配列とリンク一覧を返す
 * @param body - HTMLエスケープ済みの本文テキスト（aタグ等を含む可能性あり）
 * @returns パース済み本文
 */
export function parseBody(body: string): ParsedBody {
  // 1. <a>タグからURLを抽出
  const links = extractLinks(body);

  // 2. HTMLタグを除去してプレーンテキスト化
  const plainText = stripHtmlTags(body);

  // 3. 行単位で引用（&gt;で始まる行）とテキストに分割し、テキストを更にリンクとテキストに分割
  const segments: BodySegment[] = plainText
    .split("\n")
    .flatMap((line): BodySegment[] => {
      if (line.startsWith("&gt;")) {
        return [
          {
            type: "quote",
            content: line,
          },
        ];
      }

      return parseTextAndLinks(line);
    });

  return { segments, links };
}
