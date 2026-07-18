import { describe, expect, test } from "bun:test";
import {
  legacyFontPercentToPixels,
  readLegacyDisplaySettings,
  resolveLightMode,
} from "@/features/settings/stores/legacyDisplaySettings";

class MemoryStorage implements Storage {
  private readonly data = new Map<string, string>();
  get length(): number {
    return this.data.size;
  }
  clear(): void {
    this.data.clear();
  }
  getItem(key: string): string | null {
    return this.data.get(key) ?? null;
  }
  key(index: number): string | null {
    return [...this.data.keys()][index] ?? null;
  }
  removeItem(key: string): void {
    this.data.delete(key);
  }
  setItem(key: string, value: string): void {
    this.data.set(key, value);
  }
}

describe("legacy display settings migration", () => {
  test("reads valid legacy theme, privacy, and font values without deleting keys", () => {
    const storage = new MemoryStorage();
    storage.setItem("futaba_theme", "dark");
    storage.setItem("futaba_privacy_mode", "1");
    storage.setItem("futaba_font_size", "150");
    expect(readLegacyDisplaySettings(storage)).toEqual({
      darkMode: true,
      privacyMode: true,
      fontSize: 24,
    });
    expect(storage.getItem("futaba_theme")).toBe("dark");
    expect(storage.getItem("futaba_privacy_mode")).toBe("1");
    expect(storage.getItem("futaba_font_size")).toBe("150");
  });

  test("always gives an existing aimg-settings value priority", () => {
    const storage = new MemoryStorage();
    storage.setItem("aimg-settings", "broken-but-present");
    storage.setItem("futaba_theme", "dark");
    storage.setItem("futaba_privacy_mode", "1");
    storage.setItem("futaba_font_size", "200");
    expect(readLegacyDisplaySettings(storage)).toBeNull();
  });

  test.each([
    ["light", "0", "50", { darkMode: false, privacyMode: false, fontSize: 8 }],
    ["dark", "1", "300", { darkMode: true, privacyMode: true, fontSize: 28 }],
    ["system", "yes", "large", {}],
  ])("validates and clamps legacy values", (theme, privacy, font, expected) => {
    const storage = new MemoryStorage();
    storage.setItem("futaba_theme", theme);
    storage.setItem("futaba_privacy_mode", privacy);
    storage.setItem("futaba_font_size", font);
    expect(readLegacyDisplaySettings(storage)).toEqual(expected);
  });

  test("converts the legacy 50..300 percent range to safe current pixels", () => {
    expect(legacyFontPercentToPixels(49)).toBe(8);
    expect(legacyFontPercentToPixels(100)).toBe(16);
    expect(legacyFontPercentToPixels(300)).toBe(28);
    expect(legacyFontPercentToPixels(301)).toBe(28);
  });

  test("desktop and mobile both respect the explicit darkMode setting", () => {
    expect(resolveLightMode(true)).toBe(false);
    expect(resolveLightMode(false)).toBe(true);
    expect(resolveLightMode(null)).toBe(false);
  });
});
