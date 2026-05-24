// 非標準ブラウザAPIの型拡張
declare global {
  interface Navigator {
    deviceMemory?: number;
  }
}

const COOKIE_KEY = "fp_id";
const STORAGE_KEY = "fp_id";

// モジュールレベルキャッシュ
let cachedFingerprint: string | null = null;
// 同時呼び出し防止
let pendingPromise: Promise<string> | null = null;

// ── キャッシュ層 ──

async function getCached(): Promise<string | null> {
  if (cachedFingerprint) return cachedFingerprint;

  try {
    const fromStorage = localStorage.getItem(STORAGE_KEY);
    if (fromStorage && fromStorage.length === 64) {
      return fromStorage;
    }
  } catch (e) {
    console.warn("localStorage利用不可", e);
  }

  const fromCookie = await cookieStore.get(COOKIE_KEY);
  if (fromCookie?.value?.length === 64) {
    localStorage.setItem(STORAGE_KEY, fromCookie.value);
    await cookieStore.delete(COOKIE_KEY);

    return fromCookie.value;
  }

  return null;
}

function setCache(value: string): void {
  cachedFingerprint = value;
  try {
    localStorage.setItem(STORAGE_KEY, value);
  } catch (e) {
    console.warn("localStorage利用不可", e);
  }
}

// ── ハッシュ ──

function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

async function sha256(message: string): Promise<string> {
  try {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  } catch {
    return simpleHash(message);
  }
}

// ── コンポーネント収集（旧コード12種を忠実に再現） ──

// 1. Canvas フィンガープリント
function getCanvasFingerprint(): string {
  try {
    const canvas = document.createElement("canvas");
    canvas.width = 200;
    canvas.height = 50;
    const ctx = canvas.getContext("2d");
    if (!ctx) return "not_supported";

    ctx.textBaseline = "top";
    ctx.font = "14px Arial";
    ctx.fillStyle = "#f60";
    ctx.fillRect(125, 1, 62, 20);
    ctx.fillStyle = "#069";
    ctx.fillText("Cwm fjordbank", 2, 15);
    ctx.fillStyle = "rgba(102, 204, 0, 0.7)";
    ctx.fillText("glyphs vext quiz", 4, 17);

    ctx.beginPath();
    ctx.arc(50, 25, 20, 0, Math.PI * 2);
    ctx.fillStyle = "#6699cc";
    ctx.fill();

    return canvas.toDataURL().slice(-50);
  } catch {
    return "not_supported";
  }
}

// 2. WebGL フィンガープリント
function getWebGLFingerprint(): unknown {
  try {
    const canvas = document.createElement("canvas");
    const gl =
      canvas.getContext("webgl") ?? canvas.getContext("experimental-webgl");
    if (!gl || !(gl instanceof WebGLRenderingContext)) return "not_supported";

    const debugInfo = gl.getExtension("WEBGL_debug_renderer_info");
    return {
      vendor: gl.getParameter(gl.VENDOR),
      renderer: debugInfo
        ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL)
        : "unknown",
      version: gl.getParameter(gl.VERSION),
    };
  } catch {
    return "not_supported";
  }
}

// 3. Audio フィンガープリント
async function getAudioFingerprint(): Promise<string> {
  try {
    const context = new OfflineAudioContext(1, 44100, 44100);
    const oscillator = context.createOscillator();
    oscillator.type = "triangle";
    oscillator.frequency.setValueAtTime(10000, context.currentTime);

    const compressor = context.createDynamicsCompressor();
    compressor.threshold.setValueAtTime(-50, context.currentTime);
    compressor.knee.setValueAtTime(40, context.currentTime);
    compressor.ratio.setValueAtTime(12, context.currentTime);
    compressor.attack.setValueAtTime(0, context.currentTime);
    compressor.release.setValueAtTime(0.25, context.currentTime);

    oscillator.connect(compressor);
    compressor.connect(context.destination);
    oscillator.start(0);

    const buffer = await context.startRendering();
    const data = buffer.getChannelData(0);
    let sum = 0;
    for (let i = 4500; i < 5000; i++) {
      sum += Math.abs(data[i]);
    }
    return sum.toFixed(2);
  } catch {
    return "not_supported";
  }
}

// 4. タッチサポート検出
function getTouchSupport(): { maxTouchPoints: number; touchEvent: boolean } {
  let maxTouchPoints = 0;
  let touchEvent = false;

  if (typeof navigator.maxTouchPoints !== "undefined") {
    maxTouchPoints = navigator.maxTouchPoints;
  }

  try {
    document.createEvent("TouchEvent");
    touchEvent = true;
  } catch {
    // TouchEvent非対応
  }

  return { maxTouchPoints, touchEvent };
}

// 5. フォント検出（軽量版）
function detectFonts(): string {
  try {
    const testFonts = [
      "Arial",
      "Courier New",
      "Georgia",
      "Times New Roman",
      "Verdana",
      "Helvetica",
      "Comic Sans MS",
      "Impact",
      "Lucida Console",
      "メイリオ",
      "ＭＳ ゴシック",
      "ヒラギノ角ゴ",
    ];

    const baseFonts = ["monospace", "sans-serif", "serif"];
    const testString = "mmmmmmmmmmlli";
    const testSize = "72px";

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return "";

    const baseWidths: Record<string, number> = {};
    for (const font of baseFonts) {
      ctx.font = `${testSize} ${font}`;
      baseWidths[font] = ctx.measureText(testString).width;
    }

    const detected: string[] = [];
    for (const font of testFonts) {
      let isDetected = false;
      for (const baseFont of baseFonts) {
        ctx.font = `${testSize} "${font}", ${baseFont}`;
        const width = ctx.measureText(testString).width;
        if (width !== baseWidths[baseFont]) {
          isDetected = true;
          break;
        }
      }
      if (isDetected) {
        detected.push(font);
      }
    }

    return detected.join(",");
  } catch {
    return "";
  }
}

// 6. プラグイン検出
function getPlugins(): string {
  try {
    // navigator.plugins は非推奨だがフィンガープリント安定性のため維持
    const plugins: string[] = [];
    if (navigator.plugins) {
      for (let i = 0; i < Math.min(navigator.plugins.length, 10); i++) {
        plugins.push(navigator.plugins[i].name);
      }
    }
    return plugins.join(",");
  } catch {
    return "";
  }
}

// ── コンポーネント統合 ──

async function collectComponents(): Promise<Record<string, unknown>> {
  const components: Record<string, unknown> = {};

  components.canvas = getCanvasFingerprint();
  components.webgl = getWebGLFingerprint();
  components.audio = await getAudioFingerprint();

  components.screen = {
    width: screen.width,
    height: screen.height,
    depth: screen.colorDepth,
    pixelRatio: window.devicePixelRatio || 1,
  };

  components.timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  components.timezoneOffset = new Date().getTimezoneOffset();

  components.language = navigator.language;
  components.languages = navigator.languages
    ? navigator.languages.join(",")
    : "";

  // navigator.platform は非推奨だがフィンガープリント安定性のため維持
  components.platform = navigator.platform;
  components.userAgent = navigator.userAgent;

  components.hardwareConcurrency = navigator.hardwareConcurrency || 0;
  components.deviceMemory = navigator.deviceMemory || 0;

  components.touchSupport = getTouchSupport();
  components.fonts = detectFonts();
  components.plugins = getPlugins();
  components.webrtc = typeof RTCPeerConnection !== "undefined";

  return components;
}

// ── 内部生成処理 ──

async function computeFingerprint(): Promise<string> {
  const components = await collectComponents();
  const componentString = JSON.stringify(components);
  const hash = await sha256(componentString);
  setCache(hash);
  return hash;
}

// ── 公開API ──

/**
 * ブラウザフィンガープリントを取得する。
 * Cookie/localStorageにキャッシュがあればそれを返し、なければ生成する。
 * @returns 64文字のハッシュ文字列
 */
export async function getFingerprint(): Promise<string> {
  const cached = await getCached().catch(() => null);
  if (cached) return cached;

  // 同時呼び出し防止
  if (pendingPromise) return pendingPromise;

  pendingPromise = computeFingerprint();
  try {
    return await pendingPromise;
  } finally {
    pendingPromise = null;
  }
}
