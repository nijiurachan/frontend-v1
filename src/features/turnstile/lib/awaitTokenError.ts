export class TurnstileTimeoutError extends Error {
  constructor(
    message: string = "Turnstile トークンの取得がタイムアウトしました",
  ) {
    super(message);
    this.name = "TurnstileTimeoutError";
  }
}

export class TurnstileUnmountError extends Error {
  constructor(
    message: string = "Turnstile プロバイダがアンマウントされました",
  ) {
    super(message);
    this.name = "TurnstileUnmountError";
  }
}
