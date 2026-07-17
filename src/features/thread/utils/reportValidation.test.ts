import { describe, expect, test } from "bun:test";
import {
  getReportWholeThreadRange,
  validateReportRange,
} from "./reportValidation";

describe("validateReportRange", () => {
  test("accepts a single post", () => {
    expect(validateReportRange(12, 12)).toBeNull();
  });

  test("accepts the 50-post boundary", () => {
    expect(validateReportRange(0, 49)).toBeNull();
  });

  test("rejects a reversed range", () => {
    expect(validateReportRange(5, 4)).toContain("以下");
  });

  test("rejects a range over the limit", () => {
    expect(validateReportRange(0, 50)).toContain("50レス以内");
  });

  test("rejects missing values", () => {
    expect(validateReportRange("", 1)).toContain("入力してください");
  });

  test("adjusts whole-thread reports to the latest 50 posts", () => {
    expect(getReportWholeThreadRange(49)).toEqual({
      fromSeq: 0,
      toSeq: 49,
      usesRecentRange: false,
    });
    expect(getReportWholeThreadRange(100)).toEqual({
      fromSeq: 51,
      toSeq: 100,
      usesRecentRange: true,
    });
  });
});
