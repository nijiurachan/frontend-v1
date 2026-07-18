import { useEffect, useState } from "react";
import type {
  ExternalIframe,
  ExternalProviderMatch,
} from "@/features/thread/utils/externalProvider";
import { buildExternalIframe } from "@/features/thread/utils/externalProvider";
import {
  loadOfficialEmbedScript,
  type OfficialEmbedProvider,
} from "@/features/thread/utils/officialEmbedScript";
import { cn } from "@/shared/lib/cn";

interface Props {
  match: ExternalProviderMatch;
  parentHostname?: string;
}

export const ExternalEmbedCard: React.FunctionComponent<Props> = ({
  match,
  parentHostname,
}: Props) => {
  const scriptProvider = officialProvider(match);
  const [scriptFailed, setScriptFailed] = useState(false);

  useEffect(() => {
    if (!scriptProvider) return;
    let active = true;
    loadOfficialEmbedScript(scriptProvider).catch(() => {
      if (active) setScriptFailed(true);
    });
    return (): void => {
      active = false;
    };
  }, [scriptProvider]);

  const hostname =
    parentHostname ??
    (typeof window === "undefined" ? "localhost" : window.location.hostname);
  const iframe = buildExternalIframe(match, hostname);

  return (
    <div
      className="my-3 max-w-2xl overflow-hidden rounded-lg border border-border bg-card"
      data-provider-card={match.provider}
    >
      {iframe ? (
        <IframeEmbed iframe={iframe} />
      ) : (
        <ProviderContent match={match} />
      )}
      <a
        href={match.originalUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="block border-t border-border px-3 py-2 text-sm text-primary underline hover:bg-muted/50"
        data-embed-fallback={scriptProvider ? "true" : undefined}
      >
        {scriptFailed
          ? "埋め込みを読み込めませんでした。元のページを開く"
          : "元のページを開く"}
      </a>
    </div>
  );
};

const IframeEmbed: React.FunctionComponent<{ iframe: ExternalIframe }> = ({
  iframe,
}: {
  iframe: ExternalIframe;
}) => (
  <div
    className={cn(
      "w-full bg-black",
      iframe.height === "video" && "aspect-video",
      iframe.height === "compact" && "h-[166px]",
      iframe.height === "tall" && "h-[352px]",
    )}
  >
    <iframe
      src={iframe.src}
      title={iframe.title}
      allow={iframe.allow}
      allowFullScreen={iframe.allowFullScreen}
      loading="lazy"
      referrerPolicy="strict-origin-when-cross-origin"
      className="h-full w-full border-0"
    />
  </div>
);

const ProviderContent: React.FunctionComponent<{
  match: ExternalProviderMatch;
}> = ({ match }: { match: ExternalProviderMatch }) => {
  switch (match.provider) {
    case "x":
      return (
        <blockquote className="twitter-tweet m-3" data-dnt="true">
          <a href={match.originalUrl} target="_blank" rel="noopener noreferrer">
            ツイートを読み込み中...
          </a>
        </blockquote>
      );
    case "instagram":
      return (
        <blockquote
          className="instagram-media m-3 min-w-0"
          data-instgrm-permalink={match.canonicalUrl}
          data-instgrm-version="14"
        >
          <a href={match.originalUrl} target="_blank" rel="noopener noreferrer">
            Instagramで見る
          </a>
        </blockquote>
      );
    case "tiktok":
      return (
        <blockquote
          className="tiktok-embed m-3 min-w-0"
          cite={match.canonicalUrl}
          data-video-id={match.id}
        >
          <section>
            <a
              href={match.originalUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              TikTokで見る
            </a>
          </section>
        </blockquote>
      );
    case "pixiv":
      return (
        <LinkCard
          title={`Pixiv イラスト #${match.id}`}
          description="クリックしてPixivで見る"
        />
      );
    case "reddit":
      return (
        <LinkCard
          title={match.subreddit ? `r/${match.subreddit}` : "Reddit投稿"}
          description="クリックしてRedditで見る"
        />
      );
    default:
      return null;
  }
};

const LinkCard: React.FunctionComponent<{
  title: string;
  description: string;
}> = ({ title, description }: { title: string; description: string }) => (
  <div className="flex items-center gap-3 p-3">
    <div className="min-w-0">
      <div className="truncate text-sm font-semibold text-foreground">
        {title}
      </div>
      <div className="text-xs text-muted-foreground">{description}</div>
    </div>
  </div>
);

function officialProvider(
  match: ExternalProviderMatch,
): OfficialEmbedProvider | null {
  if (match.provider === "x") return "twitter";
  if (match.provider === "instagram") return "instagram";
  if (match.provider === "tiktok" && match.mediaType === "video")
    return "tiktok";
  return null;
}
