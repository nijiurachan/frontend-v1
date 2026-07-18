const SITE = "二次元裏@αimg(あいもげ)";
export function normalizeThreadText(value: string): string {
  return value
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}
function truncate(value: string, max: number): string {
  const chars = Array.from(value);
  return chars.length > max ? `${chars.slice(0, max).join("")}…` : value;
}
export function createThreadMetadata(
  body: string,
  threadId: string,
  origin: string,
): { title: string; description: string; canonical: string } {
  const text = normalizeThreadText(body);
  return {
    title: `${truncate(text || `No.${threadId}`, 10)} - ${SITE}`,
    description: truncate(text || `${SITE}のスレッド`, 80),
    canonical: new URL(
      `/thread/${encodeURIComponent(threadId)}`,
      origin,
    ).toString(),
  };
}
