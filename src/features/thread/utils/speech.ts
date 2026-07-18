export type SpeechMode = "bouyomi" | "browser";

export interface SpeechSettings {
  alwaysEnabled: boolean;
  autoScroll: boolean;
  port: number;
  enabledThreadIds: string[];
  mode: SpeechMode;
  rate: number;
  volume: number;
}

export const SPEECH_INITIAL_COOLDOWN_MS = 3000;
export const SPEECH_QUEUE_INTERVAL_MS = 500;
export const SPEECH_SETTINGS_EVENT = "aimg:speech-settings";
const SPEECH_MS_PER_CHAR = 200;
const SPEECH_SAFETY_MARGIN_MS = 2000;

export const DEFAULT_SPEECH_SETTINGS: SpeechSettings = {
  alwaysEnabled: false,
  autoScroll: false,
  port: 50080,
  enabledThreadIds: [],
  mode: "bouyomi",
  rate: 1,
  volume: 1,
};

function validPort(value: unknown): number | null {
  return typeof value === "number" &&
    Number.isInteger(value) &&
    value >= 1 &&
    value <= 65535
    ? value
    : null;
}

function portFromEndpoint(value: unknown): number | null {
  if (typeof value !== "string" || value === "") return null;
  try {
    const url = new URL(value);
    if (url.protocol !== "http:") return null;
    return validPort(url.port === "" ? 80 : Number(url.port));
  } catch {
    return null;
  }
}

function finiteNumber(value: unknown, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function loadSpeechSettings(
  storage: Pick<Storage, "getItem">,
): SpeechSettings {
  try {
    const raw = JSON.parse(storage.getItem("bouyomiSettings") ?? "null") as
      | (Partial<SpeechSettings> & { endpoint?: unknown })
      | null;
    if (!raw) return DEFAULT_SPEECH_SETTINGS;
    return {
      alwaysEnabled:
        typeof raw.alwaysEnabled === "boolean" ? raw.alwaysEnabled : false,
      autoScroll: typeof raw.autoScroll === "boolean" ? raw.autoScroll : false,
      port: validPort(raw.port) ?? portFromEndpoint(raw.endpoint) ?? 50080,
      enabledThreadIds: Array.isArray(raw.enabledThreadIds)
        ? [...new Set(raw.enabledThreadIds)].filter(
            (value): value is string => typeof value === "string",
          )
        : [],
      mode: raw.mode === "browser" ? "browser" : "bouyomi",
      rate: Math.max(0.5, Math.min(2, finiteNumber(raw.rate, 1))),
      volume: Math.max(0, Math.min(1, finiteNumber(raw.volume, 1))),
    };
  } catch {
    return DEFAULT_SPEECH_SETTINGS;
  }
}

export function saveSpeechSettings(
  storage: Pick<Storage, "setItem">,
  settings: SpeechSettings,
): void {
  try {
    storage.setItem("bouyomiSettings", JSON.stringify(settings));
    if (typeof dispatchEvent === "function" && typeof Event !== "undefined") {
      dispatchEvent(new Event(SPEECH_SETTINGS_EVENT));
    }
  } catch {
    // Private mode and exhausted storage must not break thread browsing.
  }
}

export function speechText(body: string): string {
  const normalized = body
    .replace(/https?:\/\/\S+/gi, "")
    .replace(/\s+/g, " ")
    .trim();
  return normalized.length > 200
    ? `${normalized.slice(0, 200)}...`
    : normalized;
}

function wait(ms: number, signal?: AbortSignal): Promise<void> {
  if (signal?.aborted) return Promise.resolve();
  return new Promise((resolve) => {
    const timer = setTimeout(resolve, ms);
    signal?.addEventListener(
      "abort",
      () => {
        clearTimeout(timer);
        resolve();
      },
      { once: true },
    );
  });
}

async function speakWithBrowser(
  body: string,
  settings: SpeechSettings,
  signal?: AbortSignal,
): Promise<boolean> {
  if (
    !("speechSynthesis" in globalThis) ||
    typeof SpeechSynthesisUtterance === "undefined"
  ) {
    return false;
  }

  await new Promise<void>((resolve) => {
    const utterance = new SpeechSynthesisUtterance(body);
    utterance.lang = "ja-JP";
    utterance.rate = settings.rate;
    utterance.volume = settings.volume;

    let settled = false;
    const finish = (): void => {
      if (settled) return;
      settled = true;
      clearTimeout(safetyTimer);
      resolve();
    };
    const safetyTimer = setTimeout(
      finish,
      (body.length * SPEECH_MS_PER_CHAR) / settings.rate +
        SPEECH_SAFETY_MARGIN_MS,
    );
    utterance.onend = finish;
    utterance.onerror = finish;
    signal?.addEventListener(
      "abort",
      () => {
        try {
          speechSynthesis.cancel();
        } catch {
          // Unsupported implementations can throw while being torn down.
        }
        finish();
      },
      { once: true },
    );
    speechSynthesis.speak(utterance);
  });
  return true;
}

export async function speakText(
  text: string,
  settings: SpeechSettings,
  fetcher: typeof fetch = fetch,
  signal?: AbortSignal,
): Promise<void> {
  const body = speechText(text);
  if (!body || signal?.aborted) return;
  if (settings.mode === "browser") {
    if (await speakWithBrowser(body, settings, signal)) return;
    await wait(SPEECH_QUEUE_INTERVAL_MS, signal);
    return;
  }

  const url = `http://localhost:${settings.port}/Talk?text=${encodeURIComponent(body)}`;
  try {
    await fetcher(url, { mode: "no-cors", signal });
  } catch {
    if (!signal?.aborted && typeof Image !== "undefined") {
      const fallback = new Image();
      fallback.src = url;
    }
  }
  await wait(SPEECH_QUEUE_INTERVAL_MS, signal);
}
