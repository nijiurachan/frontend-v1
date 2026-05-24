import type { PostBodyLine } from "@/entities/post";

const TRAILING_PUNCT = /[!?！？]+$/;

const ALREADY_DECORATED =
  /(?:なん)?ですよ\s*(?:\.{2,}|…+|．{2,}|・{2,}|。{2,})\s*[!?！？]*\s*$/;

/**
 * Idempotent. Caller is responsible for the isMay10JST() gate AND for
 * skipping empty input — passing "" returns "なんですよ...！" by design.
 * No-op if text already ends with `(なん)?ですよ` + ellipsis-variant + `[!?！？]*`.
 */
export function decorateLineEnd(text: string): string {
  if (ALREADY_DECORATED.test(text)) return text;
  const m = text.match(TRAILING_PUNCT);
  if (m) {
    return `${text.slice(0, -m[0].length)}なんですよ...${m[0]}`;
  }
  return `${text}なんですよ...！`;
}

/**
 * Returns true on May 10 in JST (Asia/Tokyo).
 *
 * Dev-only override: setting VITE_FORCE_MAY10=1 (or "true") in .env.local
 * forces a true return for local QA. Production builds leave the env var
 * unset; do not set it in production.
 */
export function isMay10JST(now: Date = new Date()): boolean {
  const forced = import.meta.env.VITE_FORCE_MAY10;
  if (forced === "1" || forced === "true") return true;

  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Tokyo",
    month: "numeric",
    day: "numeric",
  }).formatToParts(now);
  const month = Number(parts.find((p) => p.type === "month")?.value);
  const day = Number(parts.find((p) => p.type === "day")?.value);
  return month === 5 && day === 10;
}

const KITA_INPUT = "ｷﾀ━━━━(ﾟ∀ﾟ)━━━━!!";
const KITA_OUTPUT = "ｷﾀ━━━━(ﾟ∀ﾟ)━━━━ﾝﾃﾞｽﾖ...!";

/**
 * No-op outside May 10 JST. Hardcoded swap when joined+trimmed body equals
 * KITA_INPUT (image-only post auto-text). Otherwise decorates only the last
 * non-empty line; skips entirely if that line already ends with a "ですよ..."
 * variant.
 */
export function decoratePostBody(body: PostBodyLine[]): PostBodyLine[] {
  if (!isMay10JST()) return body;

  const joined = body
    .map((l) => l.text)
    .join("\n")
    .trim();
  if (joined === KITA_INPUT) {
    return [{ type: "text", text: KITA_OUTPUT }];
  }

  let lastIdx = -1;
  for (let i = body.length - 1; i >= 0; i--) {
    if (body[i].text.trim() !== "") {
      lastIdx = i;
      break;
    }
  }
  if (lastIdx < 0) return body;

  if (ALREADY_DECORATED.test(body[lastIdx].text)) return body;

  return body.map((l, i) =>
    i === lastIdx ? { ...l, text: decorateLineEnd(l.text) } : l,
  );
}

/**
 * No-op outside May 10 JST and for empty/whitespace-only titles.
 * Hardcoded swap for KITA_INPUT; otherwise delegates to `decorateLineEnd`.
 */
export function decorateTitle(title: string): string {
  if (!isMay10JST()) return title;
  if (title.trim() === "") return title;
  if (title === KITA_INPUT) return KITA_OUTPUT;
  return decorateLineEnd(title);
}
