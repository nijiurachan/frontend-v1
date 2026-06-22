// src/features/jukebox/api/jukeboxClient.ts
import { createJukeboxClient } from "@nijiurachan/js/io/jukebox-api";

const JUKEBOX_BASE_URL =
  import.meta.env.VITE_MUSIC_BASE_URL ?? "https://music.nijiurachan.net";

export const jukeboxClient: ReturnType<typeof createJukeboxClient> =
  createJukeboxClient({ baseUrl: JUKEBOX_BASE_URL });

export const JUKEBOX_STATE_KEY = ["jukebox", "state"] as const;
