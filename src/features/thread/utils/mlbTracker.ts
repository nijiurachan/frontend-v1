const PLAYER_ID = 608070;

interface ScheduleGame {
  gamePk: number;
  status?: {
    abstractGameState?: string;
    detailedState?: string;
  };
}

interface ScheduleResponse {
  dates?: Array<{ games?: ScheduleGame[] }>;
}

interface LiveFeedResponse {
  liveData?: {
    plays?: {
      allPlays?: Array<{
        matchup?: { batter?: { id?: number } };
        result?: { event?: string };
      }>;
    };
  };
}

interface StatsResponse {
  stats?: Array<{
    splits?: Array<{
      stat?: { avg?: string; homeRuns?: number; rbi?: number; ops?: string };
    }>;
  }>;
}

async function fetchJson<T>(
  fetcher: typeof fetch,
  url: string,
  signal?: AbortSignal,
): Promise<T> {
  const response = await fetcher(url, { signal });
  if (!response.ok) throw new Error(`MLB API error: ${response.status}`);
  return (await response.json()) as T;
}

function easternDate(now: Date): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const value = (type: Intl.DateTimeFormatPartTypes): string =>
    parts.find((part) => part.type === type)?.value ?? "";
  return `${value("year")}-${value("month")}-${value("day")}`;
}

function pickGame(games: ScheduleGame[]): ScheduleGame {
  const game =
    games.find((game) => game.status?.abstractGameState === "Live") ??
    games.find((game) => game.status?.abstractGameState === "Preview") ??
    games.at(-1);
  if (!game) throw new Error("MLB schedule has no games");
  return game;
}

async function loadSeasonLine(
  fetcher: typeof fetch,
  season: number,
  signal?: AbortSignal,
): Promise<string> {
  const data = await fetchJson<StatsResponse>(
    fetcher,
    `https://statsapi.mlb.com/api/v1/people/${PLAYER_ID}/stats?stats=season&season=${season}&group=hitting`,
    signal,
  );
  const stat = data.stats?.[0]?.splits?.[0]?.stat;
  return stat
    ? `打率${stat.avg ?? ".000"} ${stat.homeRuns ?? 0}HR ${stat.rbi ?? 0}打点 OPS${stat.ops ?? ".000"}`
    : "";
}

export async function loadMlbSummary(
  fetcher: typeof fetch = fetch,
  now: Date = new Date(),
  signal?: AbortSignal,
): Promise<string> {
  const schedule = await fetchJson<ScheduleResponse>(
    fetcher,
    `https://statsapi.mlb.com/api/v1/schedule?sportId=1&date=${easternDate(now)}&teamId=114`,
    signal,
  );
  const games = schedule.dates?.[0]?.games ?? [];
  if (games.length === 0) return "本日ガーディアンズの試合はありません";

  const game = pickGame(games);
  const status = game.status?.detailedState ?? "";
  const statsPromise = loadSeasonLine(fetcher, now.getFullYear(), signal);
  if (["Scheduled", "Pre-Game", "Warmup"].includes(status)) {
    const stats = await statsPromise;
    return `José Ramírez | ${["試合開始前", stats].filter(Boolean).join(" / ")}`;
  }

  const [feed, stats] = await Promise.all([
    fetchJson<LiveFeedResponse>(
      fetcher,
      `https://statsapi.mlb.com/api/v1.1/game/${game.gamePk}/feed/live`,
      signal,
    ),
    statsPromise,
  ]);
  const atBats = (feed.liveData?.plays?.allPlays ?? []).flatMap((play) =>
    play.matchup?.batter?.id === PLAYER_ID && play.result?.event
      ? [play.result.event]
      : [],
  );
  const lines = atBats.map((event, index) => `第${index + 1}打席: ${event}`);
  if (lines.length === 0) lines.push("まだ打席なし");
  if (stats) lines.push(stats);
  return `José Ramírez | ${lines.join(" / ")}`;
}
