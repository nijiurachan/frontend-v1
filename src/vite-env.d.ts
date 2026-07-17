/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_BASE_URL: string;
  readonly VITE_MAX_ATTACHMENT_BYTES?: string;
  readonly VITE_KLECKS_EMBED_URL?: string;
  readonly BASE_PATH: string;
  readonly APP_NAME: string;
  readonly VITE_FORCE_MAY10?: string;
  readonly VITE_MUSIC_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
