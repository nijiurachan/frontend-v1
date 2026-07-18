import { describe, expect, test } from "bun:test";
import {
  buildForcePcUrl,
  buildMobileVersionUrl,
  createForcePcCookie,
  resolveDesktopDisplayMode,
  resolveForcePcPreference,
} from "@/shared/lib/forcePc";

describe("force PC version URLs", () => {
  test.each([
    [{ pathname: "/", search: "", hash: "" }, "/?pc=1"],
    [
      {
        pathname: "/thread/019baebe-c300-7b40-89a6-1470b0efd51f",
        search: "?sort=new&word=a%20b",
        hash: "#post-42",
      },
      "/thread/019baebe-c300-7b40-89a6-1470b0efd51f?sort=new&word=a%20b&pc=1#post-42",
    ],
    [
      { pathname: "/archive", search: "?page=2", hash: "#older" },
      "/archive?page=2&pc=1#older",
    ],
    [
      {
        pathname: "/gallery/thread-uuid",
        search: "?pc=0&start=3",
        hash: "#image",
      },
      "/gallery/thread-uuid?start=3&pc=1#image",
    ],
    [
      { pathname: "/settings", search: "?tab=display", hash: "" },
      "/settings?tab=display&pc=1",
    ],
  ])("keeps the current route, query, and hash", (location, expected) => {
    expect(buildForcePcUrl(location)).toBe(expected);
  });

  test("builds an explicit mobile-version URL without losing current state", () => {
    expect(
      buildMobileVersionUrl({
        pathname: "/thread/thread-uuid",
        search: "?filter=unread&pc=1",
        hash: "#post-8",
      }),
    ).toBe("/thread/thread-uuid?filter=unread&pc=0#post-8");
  });
});

describe("force PC preference", () => {
  test("uses the cookie when there is no explicit URL preference", () => {
    expect(resolveForcePcPreference("", "theme=dark; force_pc=1")).toEqual({
      isForced: true,
      cookieAction: "none",
    });
    expect(resolveForcePcPreference("", "theme=dark")).toEqual({
      isForced: false,
      cookieAction: "none",
    });
  });

  test("pc=1 enables PC mode and requests a fresh 24-hour cookie", () => {
    expect(resolveForcePcPreference("?view=all&pc=1", "")).toEqual({
      isForced: true,
      cookieAction: "set",
    });
  });

  test("explicit disable wins over the cookie and duplicate enable values", () => {
    expect(
      resolveForcePcPreference("?pc=1&filter=all&pc=0", "force_pc=1"),
    ).toEqual({
      isForced: false,
      cookieAction: "clear",
    });
  });

  test("distinguishes forced PC mode from normal responsive desktop", () => {
    expect(resolveDesktopDisplayMode(false, false)).toBe("mobile");
    expect(resolveDesktopDisplayMode(true, false)).toBe("responsive-desktop");
    expect(resolveDesktopDisplayMode(false, true)).toBe("forced-desktop");
    expect(resolveDesktopDisplayMode(true, true)).toBe("forced-desktop");
  });
});

describe("force PC cookie", () => {
  const now = Date.parse("2026-07-18T00:00:00.000Z");

  test("creates a Path=/ cookie that expires after 24 hours", () => {
    expect(createForcePcCookie("set", now)).toBe(
      "force_pc=1; Expires=Sun, 19 Jul 2026 00:00:00 GMT; Max-Age=86400; Path=/; SameSite=Lax",
    );
  });

  test("creates a Path=/ deletion cookie", () => {
    expect(createForcePcCookie("clear", now)).toBe(
      "force_pc=; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Max-Age=0; Path=/; SameSite=Lax",
    );
  });
});
