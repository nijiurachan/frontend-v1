export const FORCE_PC_COOKIE_NAME = "force_pc";
export const FORCE_PC_MAX_AGE_SECONDS: number = 24 * 60 * 60;

export type ForcePcCookieAction = "set" | "clear" | "none";

export interface ForcePcPreference {
  isForced: boolean;
  cookieAction: ForcePcCookieAction;
}

export interface CurrentLocationParts {
  pathname: string;
  search: string;
  hash: string;
}

export type DesktopDisplayMode =
  | "mobile"
  | "responsive-desktop"
  | "forced-desktop";

export function buildForcePcUrl(location: CurrentLocationParts): string {
  return buildVersionUrl(location, "1");
}

export function buildMobileVersionUrl(location: CurrentLocationParts): string {
  return buildVersionUrl(location, "0");
}

export function resolveForcePcPreference(
  search: string,
  cookieHeader: string,
): ForcePcPreference {
  const pcValues = new URLSearchParams(stripPrefix(search, "?")).getAll("pc");

  if (pcValues.includes("0")) {
    return { isForced: false, cookieAction: "clear" };
  }
  if (pcValues.includes("1")) {
    return { isForced: true, cookieAction: "set" };
  }

  return {
    isForced: hasForcePcCookie(cookieHeader),
    cookieAction: "none",
  };
}

export function resolveDesktopDisplayMode(
  viewportIsDesktop: boolean,
  forcePc: boolean,
): DesktopDisplayMode {
  if (forcePc) return "forced-desktop";
  return viewportIsDesktop ? "responsive-desktop" : "mobile";
}

export function createForcePcCookie(
  action: Exclude<ForcePcCookieAction, "none">,
  now: number = Date.now(),
): string {
  if (action === "clear") {
    return `${FORCE_PC_COOKIE_NAME}=; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Max-Age=0; Path=/; SameSite=Lax`;
  }

  const expires = new Date(now + FORCE_PC_MAX_AGE_SECONDS * 1000).toUTCString();
  return `${FORCE_PC_COOKIE_NAME}=1; Expires=${expires}; Max-Age=${FORCE_PC_MAX_AGE_SECONDS}; Path=/; SameSite=Lax`;
}

function buildVersionUrl(
  location: CurrentLocationParts,
  pcValue: "0" | "1",
): string {
  const queryParts = stripPrefix(location.search, "?")
    .split("&")
    .filter((part) => part !== "" && getQueryKey(part) !== "pc");
  queryParts.push(`pc=${pcValue}`);

  return `${location.pathname}?${queryParts.join("&")}${location.hash}`;
}

function getQueryKey(queryPart: string): string {
  const rawKey = queryPart.split("=", 1)[0] ?? "";
  try {
    return decodeURIComponent(rawKey.replaceAll("+", " "));
  } catch {
    return rawKey;
  }
}

function hasForcePcCookie(cookieHeader: string): boolean {
  return cookieHeader.split(";").some((part) => {
    const separator = part.indexOf("=");
    if (separator < 0) return false;

    const name = part.slice(0, separator).trim();
    const value = part.slice(separator + 1).trim();
    return name === FORCE_PC_COOKIE_NAME && value === "1";
  });
}

function stripPrefix(value: string, prefix: string): string {
  return value.startsWith(prefix) ? value.slice(prefix.length) : value;
}
