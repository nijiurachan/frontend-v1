import { ExternalEmbedCard } from "@/features/thread/components/ExternalEmbedCard";
import { detectExternalProvider } from "@/features/thread/utils/externalProvider";
import type { OgpData } from "@/shared/types/ogp";

interface Props {
  ogp: OgpData;
}

export const OgpCard: React.FunctionComponent<Props> = ({ ogp }: Props) => {
  const ogpMetadata = ogp.data;
  const dedicated = detectExternalProvider(ogp.url);

  // 呼び出し元が旧経路でもYouTube/Xを含む専用表示を維持する。
  if (dedicated) return <ExternalEmbedCard match={dedicated} />;

  // 文字列をパースして有効な正の数値のみを返す
  const parsePositiveNumber = (value?: string): number | undefined => {
    if (!value) return undefined;
    const num = parseInt(value, 10);
    return Number.isFinite(num) && num > 0 ? num : undefined;
  };

  // OGP情報がある場合のみ表示
  let ogpImageUrl = ogpMetadata.image || ogpMetadata.imageUrl;
  if (ogpImageUrl) {
    // 相対URLやプロトコル相対URLをOGPページのURL基準で絶対URLに変換
    try {
      ogpImageUrl = new URL(ogpImageUrl, ogp.url).toString();
    } catch {
      // URLのパースに失敗した場合は何もしない
    }
  }
  if (!ogpMetadata.title && !ogpMetadata.description && !ogpImageUrl) {
    return null;
  }

  return (
    <div className="border border-border rounded-lg overflow-hidden bg-card max-w-lg">
      {/* OGP画像 */}
      {ogpImageUrl && (
        <a
          href={ogpImageUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="block overflow-hidden"
        >
          <img
            src={ogpImageUrl}
            alt={ogpMetadata.title || ""}
            className="w-full h-auto object-cover max-h-64"
            loading="lazy"
            width={parsePositiveNumber(ogpMetadata.imageWidth)}
            height={parsePositiveNumber(ogpMetadata.imageHeight)}
          />
        </a>
      )}

      {/* リンク情報 */}
      <a
        href={ogp.url}
        target="_blank"
        rel="noopener noreferrer"
        className="block p-3 hover:bg-muted/50 transition-colors"
      >
        {ogpMetadata.siteName && (
          <div className="text-xs text-muted-foreground mb-1">
            {ogpMetadata.siteName}
          </div>
        )}
        {ogpMetadata.title && (
          <div className="font-semibold text-foreground text-sm mb-1 line-clamp-2">
            {ogpMetadata.title}
          </div>
        )}
        {ogpMetadata.description && (
          <div className="text-xs text-muted-foreground line-clamp-2">
            {ogpMetadata.description}
          </div>
        )}
      </a>
    </div>
  );
};
