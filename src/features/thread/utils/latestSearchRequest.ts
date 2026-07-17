export interface LatestSearchRequest {
  generation: number;
  signal: AbortSignal;
}

/** Keeps only the latest search request eligible to update UI state. */
export class LatestSearchRequestGuard {
  private generation = 0;
  private controller: AbortController | null = null;

  start(): LatestSearchRequest {
    this.controller?.abort();
    this.generation += 1;
    this.controller = new AbortController();
    return {
      generation: this.generation,
      signal: this.controller.signal,
    };
  }

  isCurrent(request: LatestSearchRequest): boolean {
    return request.generation === this.generation && !request.signal.aborted;
  }

  finish(request: LatestSearchRequest): void {
    if (request.generation === this.generation) this.controller = null;
  }

  cancel(): void {
    this.generation += 1;
    this.controller?.abort();
    this.controller = null;
  }
}

export function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === "AbortError";
}
