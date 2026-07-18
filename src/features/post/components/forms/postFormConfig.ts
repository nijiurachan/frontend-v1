export const POST_BODY_MAX_LENGTH = 4000;

export function formatPostBodyLength(length: number): string {
  return `${length} / ${POST_BODY_MAX_LENGTH}文字`;
}
