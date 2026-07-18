import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { Post } from "@/entities/post";
import { resolveUploadPath } from "@/entities/thread";
import { PostBlock } from "@/features/thread/components/views/space/PostBlock";
import { useCrawlProgress } from "@/features/thread/components/views/space/useCrawlProgress";
import { decorateTitle, isVideoAttachment } from "@/shared/lib";

interface Props {
  posts: Post[];
}

// 本編のクロール速度に合わせてスレ長に関係なく一定で流す。
// ユーザーはホイール/タッチで先送りできる前提。
const PX_PER_SECOND = 30;

// SW 本編イントロ準拠 (gesteves.com の CSS 実装を参照):
// ロゴは 60% まで静止し残り 40% を ease-in で縮小&フェードアウト。
// クロールはロゴ出現から 10s 後に立ち上がり、ロゴが中央で小さく消えかけた
// あたりで本文がボード下から顔を出す。
const PROLOGUE_MS = 6000;
const LOGO_MS = 11000;
const CRAWL_OVERLAP_MS = 10000;

export const SpaceCrawlView: React.FunctionComponent<Props> = ({
  posts,
}: Props) => {
  const [firstPost, ...rest] = posts;

  const prefersReducedMotion = useMemo<boolean>(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    [],
  );

  const [prologueVisible, setPrologueVisible] = useState<boolean>(
    !prefersReducedMotion,
  );
  const [logoVisible, setLogoVisible] = useState<boolean>(false);
  const [crawlMounted, setCrawlMounted] =
    useState<boolean>(prefersReducedMotion);

  useEffect(() => {
    if (prefersReducedMotion) return;
    const t1 = window.setTimeout(() => {
      setPrologueVisible(false);
      setLogoVisible(true);
    }, PROLOGUE_MS);
    const t2 = window.setTimeout(
      () => setCrawlMounted(true),
      PROLOGUE_MS + CRAWL_OVERLAP_MS,
    );
    const t3 = window.setTimeout(
      () => setLogoVisible(false),
      PROLOGUE_MS + LOGO_MS,
    );
    return (): void => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.clearTimeout(t3);
    };
  }, [prefersReducedMotion]);

  const attachment = firstPost?.attachment;
  const imageSrc = attachment
    ? resolveUploadPath(
        isVideoAttachment(attachment)
          ? attachment.thumbnailUrl
          : attachment.originalUrl,
      )
    : null;
  const hasBody = firstPost ? firstPost.body.trim().length > 0 : false;

  if (!firstPost) return null;

  return (
    <>
      {prologueVisible && hasBody && (
        <div className="sw-prologue-overlay" aria-hidden>
          <p className="sw-prologue-text">{decorateTitle(firstPost.body)}</p>
        </div>
      )}
      {crawlMounted && <CrawlRunner rest={rest} />}
      {logoVisible && imageSrc && (
        <div className="sw-logo-overlay" aria-hidden>
          <img
            className="sw-logo-image"
            src={imageSrc}
            alt=""
            loading="eager"
            style={
              { "--sw-logo-duration": `${LOGO_MS}ms` } as React.CSSProperties
            }
            onError={(e: React.SyntheticEvent<HTMLImageElement>): void => {
              e.currentTarget.style.display = "none";
            }}
          />
        </div>
      )}
    </>
  );
};

interface CrawlRunnerProps {
  rest: Post[];
}

const CrawlRunner: React.FunctionComponent<CrawlRunnerProps> = ({
  rest,
}: CrawlRunnerProps) => {
  const crawlContentRef = useRef<HTMLDivElement | null>(null);
  const [contentHeight, setContentHeight] = useState<number>(0);

  useLayoutEffect(() => {
    const el = crawlContentRef.current;
    if (!el) return;
    const measure = (): void => setContentHeight(el.offsetHeight);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return (): void => ro.disconnect();
  }, []);

  const totalDistance =
    contentHeight + (typeof window !== "undefined" ? window.innerHeight : 800);

  const { ref, onWheel, onTouchStart, onTouchMove, onTouchEnd, onTouchCancel } =
    useCrawlProgress({
      totalDistance,
      pxPerSecond: PX_PER_SECOND,
    });

  return (
    <section
      className="sw-viewport"
      aria-label="スレッドのオープニングクロール"
      ref={ref}
      onWheel={onWheel}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onTouchCancel={onTouchCancel}
    >
      <div className="sw-board">
        <div className="sw-crawl" ref={crawlContentRef}>
          {rest.map((post) => (
            <PostBlock key={post.id} post={post} />
          ))}
        </div>
      </div>
    </section>
  );
};
