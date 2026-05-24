import { useQuery } from "@tanstack/react-query";
import { API_BASE } from "@/shared/api/client";

export interface ThreadLimits {
  duration_hours: number;
  min_minutes: number;
  active_threads?: number;
}

const CACHE_KEY: string = "aimg-thread-limits";
const STALE_TIME_MS: number = 5 * 60 * 1000;

function readCache(): ThreadLimits | undefined {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return undefined;
    const parsed = JSON.parse(raw) as Partial<ThreadLimits>;
    const durationHours = Number(parsed?.duration_hours);
    const minMinutes = Number(parsed?.min_minutes);
    if (!Number.isFinite(durationHours) || durationHours <= 0) return undefined;
    if (!Number.isFinite(minMinutes) || minMinutes <= 0) return undefined;
    return {
      duration_hours: Math.floor(durationHours),
      min_minutes: Math.floor(minMinutes),
    };
  } catch {
    return undefined;
  }
}

function writeCache(limits: ThreadLimits): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(limits));
  } catch {
    // localStorage may be unavailable (private mode / quota)
  }
}

async function fetchThreadLimits(): Promise<ThreadLimits> {
  const res = await fetch(`${API_BASE}/v1/thread-limits`, {
    mode: "cors",
    headers: { Accept: "application/json" },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const payload = await res.json();
  // spec §2: prefer payload.data, fall back to payload itself
  const data = (payload?.data ?? payload) as Partial<ThreadLimits>;
  const durationHours = Number(data.duration_hours);
  const minMinutes = Number(data.min_minutes);
  if (!Number.isFinite(durationHours) || durationHours <= 0) {
    throw new Error("invalid duration_hours");
  }
  if (!Number.isFinite(minMinutes) || minMinutes <= 0) {
    throw new Error("invalid min_minutes");
  }
  const activeThreadsRaw = Number(data.active_threads);
  const limits: ThreadLimits = {
    duration_hours: Math.floor(durationHours),
    min_minutes: Math.floor(minMinutes),
    active_threads: Number.isFinite(activeThreadsRaw)
      ? Math.floor(activeThreadsRaw)
      : undefined,
  };
  writeCache(limits);
  return limits;
}

export function useThreadLimits(): ReturnType<
  typeof useQuery<ThreadLimits, Error>
> {
  return useQuery<ThreadLimits, Error>({
    queryKey: ["thread-limits"],
    queryFn: fetchThreadLimits,
    staleTime: STALE_TIME_MS,
    gcTime: Number.POSITIVE_INFINITY,
    retry: 1,
    // Use cached previous value as initial data so the UI renders instantly.
    // initialDataUpdatedAt = 0 forces the query to be considered stale and
    // refetched in the background (tier shrinkage must propagate).
    initialData: readCache,
    initialDataUpdatedAt: 0,
  });
}
