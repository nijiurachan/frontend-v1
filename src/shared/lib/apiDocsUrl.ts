const API_UI_PATH = "/api/ui";

/** APIドキュメントの公開URLを、設定されたAPI originから組み立てる。 */
export function getApiUiUrl(baseUrl?: string): string {
  const configuredBaseUrl = baseUrl ?? import.meta.env.VITE_BASE_URL ?? "";

  if (!configuredBaseUrl.trim()) {
    return API_UI_PATH;
  }

  return new URL(API_UI_PATH, configuredBaseUrl).toString();
}
