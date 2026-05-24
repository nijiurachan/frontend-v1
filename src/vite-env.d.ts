/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_BASE_URL: string;
  readonly VITE_TURNSTILE_SITE_KEY: string;
  readonly BASE_PATH: string;
  readonly APP_NAME: string;
  readonly VITE_FORCE_MAY10?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
