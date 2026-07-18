export const FONT_SIZE_MIN = 8;
export const FONT_SIZE_MAX = 28;
export const FONT_SIZE_DEFAULT = 16;

export interface LegacyDisplaySettings {
  darkMode?: boolean;
  privacyMode?: boolean;
  fontSize?: number;
}

export function readLegacyDisplaySettings(
  storage: Storage,
): LegacyDisplaySettings | null {
  if (storage.getItem("aimg-settings") !== null) return null;

  const settings: LegacyDisplaySettings = {};
  const theme = storage.getItem("futaba_theme");
  if (theme === "dark") settings.darkMode = true;
  if (theme === "light") settings.darkMode = false;

  const privacy = storage.getItem("futaba_privacy_mode");
  if (privacy === "1") settings.privacyMode = true;
  if (privacy === "0") settings.privacyMode = false;

  const rawFont = storage.getItem("futaba_font_size");
  if (rawFont !== null && rawFont.trim() !== "") {
    const percent = Number(rawFont);
    if (Number.isFinite(percent)) {
      settings.fontSize = legacyFontPercentToPixels(percent);
    }
  }
  return settings;
}

export function legacyFontPercentToPixels(percent: number): number {
  const safePercent = Math.max(50, Math.min(300, percent));
  const pixels = Math.round((FONT_SIZE_DEFAULT * safePercent) / 100);
  return Math.max(FONT_SIZE_MIN, Math.min(FONT_SIZE_MAX, pixels));
}

export function resolveLightMode(darkMode: boolean | null): boolean {
  return darkMode === false;
}
