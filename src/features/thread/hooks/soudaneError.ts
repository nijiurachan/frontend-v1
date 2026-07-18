export function isDuplicateSoudaneError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const apiError = error as Error & { status?: unknown; code?: unknown };
  return apiError.status === 409 && apiError.code === "DUPLICATE_REACTION";
}
