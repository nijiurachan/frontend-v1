export type OfficialEmbedProvider = "twitter" | "instagram" | "tiktok";
export type OfficialEmbedLoader = (
  provider: OfficialEmbedProvider,
  documentObject?: Document,
  windowObject?: Window,
) => Promise<void>;

const OFFICIAL_SCRIPTS: Record<OfficialEmbedProvider, string> = {
  twitter: "https://platform.twitter.com/widgets.js",
  instagram: "https://www.instagram.com/embed.js",
  tiktok: "https://www.tiktok.com/embed.js",
};

type EmbedWindow = Window & {
  twttr?: { widgets?: { load?: () => void } };
  instgrm?: { Embeds?: { process?: () => void } };
  tiktokEmbed?: { lib?: { render?: () => void } };
};

export function createOfficialEmbedScriptLoader(): OfficialEmbedLoader {
  const loads = new Map<OfficialEmbedProvider, Promise<void>>();
  return (
    provider: OfficialEmbedProvider,
    documentObject: Document = document,
    windowObject: Window = window,
  ): Promise<void> => {
    const process = (): void => processOfficialEmbed(provider, windowObject);
    const pending = loads.get(provider);
    if (pending) return pending.then(process);

    const source = OFFICIAL_SCRIPTS[provider];
    const existing = documentObject.querySelector?.(`script[src="${source}"]`);
    if (existing) {
      const ready = Promise.resolve().then(process);
      loads.set(provider, ready);
      return ready;
    }

    const load = new Promise<void>((resolve, reject) => {
      const script = documentObject.createElement("script");
      script.src = source;
      script.async = true;
      script.dataset.aimgEmbedScript = provider;
      script.onload = () => {
        process();
        resolve();
      };
      script.onerror = () =>
        reject(new Error(`${provider} embed script failed`));
      documentObject.head.appendChild(script);
    });
    loads.set(provider, load);
    return load.then(process);
  };
}

function processOfficialEmbed(
  provider: OfficialEmbedProvider,
  value: Window,
): void {
  const embedWindow = value as EmbedWindow;
  if (provider === "twitter") embedWindow.twttr?.widgets?.load?.();
  if (provider === "instagram") embedWindow.instgrm?.Embeds?.process?.();
  if (provider === "tiktok") embedWindow.tiktokEmbed?.lib?.render?.();
}

export const loadOfficialEmbedScript: OfficialEmbedLoader =
  createOfficialEmbedScriptLoader();
