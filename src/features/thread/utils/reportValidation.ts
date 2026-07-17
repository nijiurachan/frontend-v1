export const REPORT_RANGE_LIMIT = 50;

export interface ReportWholeThreadRange {
  fromSeq: number;
  toSeq: number;
  usesRecentRange: boolean;
}

export function getReportWholeThreadRange(
  lastSeq: number,
): ReportWholeThreadRange {
  const normalizedLastSeq = Math.max(0, Math.floor(lastSeq));
  return {
    fromSeq: Math.max(0, normalizedLastSeq - REPORT_RANGE_LIMIT + 1),
    toSeq: normalizedLastSeq,
    usesRecentRange: normalizedLastSeq >= REPORT_RANGE_LIMIT,
  };
}

export type ReportSeq = number | "";

/** 範囲通報の入力値を検証する。問題がなければnullを返す。 */
export function validateReportRange(
  fromSeq: ReportSeq,
  toSeq: ReportSeq,
): string | null {
  if (typeof fromSeq !== "number" || typeof toSeq !== "number") {
    return "レス番号を入力してください";
  }
  if (!Number.isInteger(fromSeq) || !Number.isInteger(toSeq)) {
    return "レス番号は整数で入力してください";
  }
  if (fromSeq < 0 || toSeq < 0) {
    return "レス番号は0以上で入力してください";
  }
  if (fromSeq > toSeq) {
    return "開始レス番号は終了レス番号以下にしてください";
  }
  if (toSeq - fromSeq + 1 > REPORT_RANGE_LIMIT) {
    return `通報範囲は${REPORT_RANGE_LIMIT}レス以内で指定してください`;
  }
  return null;
}
