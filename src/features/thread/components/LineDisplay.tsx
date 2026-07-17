// biome-ignore-all lint/suspicious/noArrayIndexKey: ここで扱うセグメント配列は変化しない

import { Fragment, useMemo } from "react";
import type { Post, PostBodyLine } from "@/entities/post";
import { PlayerTrigger } from "@/features/player/components";
import { type Segment, segmentize } from "@/shared/lib";
import { TextDiced, TextLink } from "@/shared/ui/navigation";
import { resolveQuotedPost } from "../utils/quotePreview";
import { QuoteHoverPreview } from "./QuoteHoverPreview";

interface Props {
  line: PostBodyLine;
  onQuoteClick?: (quoteText: string) => void;
  threadId: string;
  postNumber: number;
  /** モーダル等のサブビュー内表示。プレイリスト登録・チェックボックスを無効化 */
  isSubView?: boolean;
  /** 虹色モード。スレ1レス目に「レインボー」を含む場合に true */
  isRainbow?: boolean;
  allPosts?: Post[];
  onJumpToPost?: (postSeq: number) => void;
}

// 「おぺにす」/「open is」(大小無視・空白任意) + 省略記号(...) のバリアント全部にマッチ
// - \.{3,}  : 半角ピリオド3個以上
// - …+      : 水平三点リーダ (U+2026) 1個以上
// - ．{3,}  : 全角ピリオド 3個以上
// - ・{3,}  : 中黒 3個以上
const GLOW_REGEX = /(?:おぺにす|open\s*is)(?:\.{3,}|…+|．{3,}|・{3,})/gi;

function rainbowChars(text: string, offset: number): React.ReactNode {
  return Array.from(text).map((ch, i) => (
    <span
      key={i}
      style={{ color: `hsl(${((offset + i) * 36) % 360}, 90%, 60%)` }}
    >
      {ch}
    </span>
  ));
}

function renderTextSegment(
  text: string,
  offset: number,
  isRainbow: boolean,
): React.ReactNode {
  const renderChunk = (chunk: string, startOffset: number): React.ReactNode =>
    isRainbow ? rainbowChars(chunk, startOffset) : chunk;

  const matches = Array.from(text.matchAll(GLOW_REGEX));
  if (matches.length === 0) {
    return renderChunk(text, offset);
  }

  const nodes: React.ReactNode[] = [];
  const cursorEnd = matches.reduce<number>((cursor, m, idx) => {
    const start = m.index ?? 0;
    if (start > cursor) {
      const chunk = text.slice(cursor, start);
      nodes.push(
        <Fragment key={`t-${idx}`}>
          {renderChunk(chunk, offset + cursor)}
        </Fragment>,
      );
    }
    nodes.push(
      <span key={`g-${idx}`} className="text-glow">
        {renderChunk(m[0], offset + start)}
      </span>,
    );
    return start + m[0].length;
  }, 0);
  if (cursorEnd < text.length) {
    const tail = text.slice(cursorEnd);
    nodes.push(
      <Fragment key="t-tail">{renderChunk(tail, offset + cursorEnd)}</Fragment>,
    );
  }
  return nodes;
}

export const LineDisplay: React.FunctionComponent<Props> = ({
  line,
  onQuoteClick,
  threadId,
  postNumber,
  isSubView,
  isRainbow,
  allPosts,
  onJumpToPost,
}: Props) => {
  const segments = useMemo(() => segmentize(line.text), [line.text]); //１行を解釈してquoteかどうか判別し、link属性とdice属性が見つかればセグメントに分ける。

  // 各セグメントの開始文字オフセット（連続した虹色サイクル用）
  const segmentOffsets = useMemo<number[]>(() => {
    const offsets: number[] = [];
    segments.reduce<number>((acc: number, seg: Segment) => {
      offsets.push(acc);
      const len = seg.type === "dice" ? 0 : seg.content.length;
      return acc + len;
    }, 0);
    return offsets;
  }, [segments]);

  if (line.type === "quote") {
    const quoteTarget = allPosts
      ? resolveQuotedPost(line.text, postNumber, allPosts)
      : null;
    return (
      <QuoteHoverPreview target={quoteTarget} onJumpToPost={onJumpToPost}>
        <span>
          {segments.map((seg: Segment, i: number) => {
            if (seg.type === "link") {
              return (
                <TextLink key={i} href={seg.href} variant="primary">
                  {seg.content}
                </TextLink>
              );
            }
            if (seg.type === "dice") {
              return (
                <TextDiced
                  key={i}
                  prefix={seg.prefix}
                  resultValue={seg.resultValue}
                  suffix={seg.suffix}
                />
              );
            }
            // 虹色モードでも引用行は従来の quote 色 (緑) を維持
            return (
              // biome-ignore lint/a11y/noStaticElementInteractions: TODO label＆buttonで置き換え予定
              // biome-ignore lint/a11y/useKeyWithClickEvents: TODO label＆buttonで置き換え予定
              <span
                key={i}
                className="text-quote cursor-pointer hover:underline"
                onClick={(): void => onQuoteClick?.(line.text)}
              >
                {seg.content}
              </span>
            );
          })}
        </span>
      </QuoteHoverPreview>
    );
  }

  return (
    <span>
      {segments.map((seg: Segment, i: number) => {
        if (seg.type === "link") {
          return (
            <Fragment key={i}>
              <TextLink href={seg.href} variant="primary">
                {seg.content}
              </TextLink>
              <PlayerTrigger
                url={seg.href}
                threadId={threadId}
                postNo={postNumber}
                isSubView={isSubView}
              />
            </Fragment>
          );
        }
        if (seg.type === "dice") {
          return (
            <TextDiced
              key={i}
              prefix={seg.prefix}
              resultValue={seg.resultValue}
              suffix={seg.suffix}
            />
          );
        }
        return (
          <span key={i}>
            {renderTextSegment(
              seg.content,
              segmentOffsets[i],
              isRainbow ?? false,
            )}
          </span>
        );
      })}
    </span>
  );
};
