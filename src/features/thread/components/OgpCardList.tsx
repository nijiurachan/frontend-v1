import { useEffect, useMemo, useRef, useState } from "react";
import { ExternalEmbedCard } from "@/features/thread/components/ExternalEmbedCard";
import { OgpCard } from "@/features/thread/components/OgpCard";
import { detectExternalProvider } from "@/features/thread/utils/externalProvider";
import { useOgpProxy } from "@/shared/hooks/useOgpProxy";
import { isDlafIdMismatch } from "@/shared/lib";

interface Props {
  urls: string[];
  genericOgpEnabled?: boolean;
}

export const OgpCardList: React.FunctionComponent<Props> = ({
  urls,
  genericOgpEnabled = true,
}: Props) => {
  // 重複URLを削除
  const uniqueUrls = useMemo(() => {
    return Array.from(new Set(urls));
  }, [urls]);

  if (uniqueUrls.length === 0) return null;

  return (
    <div className="space-y-2 mt-3">
      {uniqueUrls.map((url) => (
        <PreviewItem
          key={url}
          url={url}
          genericOgpEnabled={genericOgpEnabled}
        />
      ))}
    </div>
  );
};

const PreviewItem: React.FunctionComponent<{
  url: string;
  genericOgpEnabled: boolean;
}> = ({
  url,
  genericOgpEnabled,
}: {
  url: string;
  genericOgpEnabled: boolean;
}) => {
  const dedicated = detectExternalProvider(url);
  if (dedicated) return <ExternalEmbedCard match={dedicated} />;
  if (!genericOgpEnabled) return null;
  return <OgpCardItem url={url} />;
};

const OgpCardItem: React.FunctionComponent<{ url: string }> = ({
  url,
}: {
  url: string;
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const elementRef = useRef<HTMLDivElement>(null);

  // Intersection Observerで可視領域に入ったら読み込み開始
  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.unobserve(entry.target);
          }
        });
      },
      {
        rootMargin: "100px", // 可視領域より100px手前で読み込み開始
      },
    );

    observer.observe(element);

    return (): void => {
      observer.disconnect();
    };
  }, []);

  const { data: ogp, isLoading, isError } = useOgpProxy(isVisible ? url : null);

  if (!isVisible || isLoading) {
    return (
      <div
        ref={elementRef}
        className="mt-3 border border-border rounded-lg p-3 bg-card max-w-lg"
      >
        <div className="text-sm text-muted-foreground">
          {isVisible ? "読み込み中..." : ""}
        </div>
      </div>
    );
  }

  if (isError || !ogp) {
    return null; // OGP取得失敗時は何も表示しない
  }

  // dlaf.jp の廃版 ID 等が別作品にフォールバック転送された結果、
  // 要求 URL とは別作品の OGP が返るケースは表示しない
  if (ogp.data.url && isDlafIdMismatch(url, ogp.data.url)) {
    return null;
  }

  return (
    <div ref={elementRef}>
      <OgpCard ogp={ogp} />
    </div>
  );
};
