import { type UseQueryResult, useQuery } from "@tanstack/react-query";
import DOMPurify, { type Config } from "dompurify";
import type { DeepWritable } from "ts-essentials";
import type { Post, PostBodyLine } from "@/entities/post";
import type { ThreadDetailResponse } from "@/entities/thread";
import { apiGet } from "@/shared/api";
import { decodeHtmlEntities } from "@/shared/lib";

type RawThreadDetailResponse = Omit<ThreadDetailResponse, "posts"> & {
  posts: Array<Omit<Post, "body"> & { body: string }>;
};

/** リンクの前処理をするためDOMにする設定 */
const PARSING_DOM_PURIFY_CONFIG = {
  ALLOW_DATA_ATTR: false,
  ALLOWED_ATTR: ["href"],
  ALLOWED_TAGS: ["br", "a"],
  RETURN_DOM_FRAGMENT: true,
} as const;
type ParsingDomPurifyConfig = DeepWritable<typeof PARSING_DOM_PURIFY_CONFIG>;

/** リンクを取り除き文字列に戻す設定 */
const STRINGIFYING_DOM_PURIFY_CONFIG = {
  ALLOWED_ATTR: [],
  ALLOWED_TAGS: ["br"],
} as Config;

export const useThread = (
  threadId: number,
): UseQueryResult<ThreadDetailResponse> =>
  useQuery({
    queryKey: ["thread", threadId],
    queryFn: () => apiGet<RawThreadDetailResponse>(`/thread/${threadId}`),
    enabled: !!threadId,
    select: (data: RawThreadDetailResponse): ThreadDetailResponse => ({
      ...data,
      posts: data.posts.map((post) => {
        const body = parseBody(post.body);
        return {
          ...post,
          body,
          plainBody: body.map(({ text }) => text).join("\n"),
        };
      }),
    }),
  });

/**
 * APIから帰ってくる生HTML本文を行で分割した配列にする。
 */
function parseBody(htmlBody: string): PostBodyLine[] {
  // TODO 前処理が大変なのでサーバ側からHTMLを返さないようにする

  const parsedFragment = DOMPurify.sanitize(
    htmlBody,
    PARSING_DOM_PURIFY_CONFIG as ParsingDomPurifyConfig,
  );

  // サーバ側で長いURLがカットされるので対策
  // 後にあらためてlinkifyする
  for (const a of parsedFragment.querySelectorAll("a")) {
    a.textContent = decodeHtmlEntities(a.href);
  }

  const purified = DOMPurify.sanitize(
    parsedFragment,
    STRINGIFYING_DOM_PURIFY_CONFIG,
  );

  const body = purified.split("<br>").map((line) => ({
    type: line.startsWith("&gt;") ? ("quote" as const) : ("text" as const),
    text: decodeHtmlEntities(line),
  }));

  return body;
}
