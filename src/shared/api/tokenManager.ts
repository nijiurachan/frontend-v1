export class AimgTokenManager {
  private cachedToken: string | null = null;
  private tokenPromise: Promise<string> | null = null;
  private readonly issueToken: () => Promise<string>;

  constructor(issueToken: () => Promise<string>) {
    this.issueToken = issueToken;
  }

  async get(): Promise<string> {
    if (this.cachedToken) return this.cachedToken;
    if (this.tokenPromise) return this.tokenPromise;

    this.tokenPromise = this.issueToken();
    try {
      this.cachedToken = await this.tokenPromise;
      return this.cachedToken;
    } finally {
      this.tokenPromise = null;
    }
  }

  clear(token?: string): void {
    if (token !== undefined && this.cachedToken !== token) return;
    this.cachedToken = null;
  }

  async refresh(expiredToken: string): Promise<string> {
    if (this.cachedToken && this.cachedToken !== expiredToken) {
      return this.cachedToken;
    }
    this.clear(expiredToken);
    return this.get();
  }
}

export function shouldRetryManagedToken(
  requiresToken: boolean,
  hasExplicitToken: boolean,
  retryCount: number,
  errorCode: string | undefined,
): boolean {
  return (
    requiresToken &&
    !hasExplicitToken &&
    retryCount === 0 &&
    errorCode === "TOKEN_EXPIRED"
  );
}
