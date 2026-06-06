import { describe, expect, test } from "bun:test";
import { safeAdUrl } from "./safeAdUrl";

describe("safeAdUrl", () => {
  test("returns null for null (リンク無し広告) without throwing", () => {
    expect(safeAdUrl(null)).toBeNull();
  });

  test("returns null for empty / whitespace-only string", () => {
    expect(safeAdUrl("")).toBeNull();
    expect(safeAdUrl("   ")).toBeNull();
  });

  test("rejects non-http(s) schemes", () => {
    expect(safeAdUrl("javascript:alert(1)")).toBeNull();
    expect(safeAdUrl("data:image/png;base64,AAAA")).toBeNull();
  });

  test("rejects http (https only)", () => {
    expect(safeAdUrl("http://nijiurachan.net/ads/click/1")).toBeNull();
  });

  test("rejects hosts outside nijiurachan.net", () => {
    expect(safeAdUrl("https://evil.example/a.png")).toBeNull();
    expect(safeAdUrl("https://nijiurachan.net.evil.example/a.png")).toBeNull();
  });

  test("rejects URLs with an explicit port", () => {
    expect(safeAdUrl("https://nijiurachan.net:8443/ads/click/1")).toBeNull();
  });

  test("resolves relative paths against the ad base URL", () => {
    expect(safeAdUrl("/ads/click/123")).toBe(
      "https://nijiurachan.net/ads/click/123",
    );
  });

  test("allows nijiurachan.net and its subdomains over https", () => {
    expect(safeAdUrl("https://nijiurachan.net/ads/click/1")).toBe(
      "https://nijiurachan.net/ads/click/1",
    );
    expect(safeAdUrl("https://storage.nijiurachan.net/a.png")).toBe(
      "https://storage.nijiurachan.net/a.png",
    );
  });
});
