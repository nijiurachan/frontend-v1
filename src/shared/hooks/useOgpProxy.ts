import { useQuery } from "@tanstack/react-query";
import type { OgpData } from "@/shared/types/ogp";

// OGP情報を取得するフックAPIのURL
const OGP_PROXY_URL = "https://ogp-proxy.nijiurachan.net/_";

export type UseOgpResult = {
  data: OgpData | undefined;
  isLoading: boolean;
  isError: boolean;
};

/**
 * OGP情報を取得するフック
 *
 * 注意: このフックは OGP プロキシが `.../{base64url}` 形式のエンドポイントを提供している必要があります。
 * バックエンドでURL先のHTMLを取得し、OGPメタタグをパースしてJSONで返すAPIを実装してください。
 */
/**
 * URLをBase64URL形式にエンコードする
 * 非ASCII文字を含むURLにも対応
 */
function encodeUrlToBase64Url(url: string): string {
  // UTF-8エンコードしてからBase64化（非ASCII文字対応）
  const encoded = btoa(unescape(encodeURIComponent(url)));
  return encoded.replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

export function useOgpProxy(url: string | null): UseOgpResult {
  return useQuery({
    queryKey: ["ogp", url],
    queryFn: async (): Promise<OgpData> => {
      if (!url) throw new Error("URL is required");
      const encodedUrl = encodeUrlToBase64Url(url);
      const requestUrl = `${OGP_PROXY_URL}/${encodedUrl}`;
      const response = await fetch(requestUrl);
      if (!response.ok)
        throw new Error(`Failed to fetch OGP: ${response.statusText}`);
      return response.json() as Promise<OgpData>;
    },
    enabled: !!url,
    staleTime: 7 * 24 * 60 * 60 * 1000, // 1週間
    retry: 1,
  });
}
