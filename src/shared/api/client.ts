import { getFingerprint } from "@/shared/lib/fingerprint";
import { type AltchaChallenge, solveAltcha } from "./altcha";
import { readAttachmentForUpload } from "./attachmentUpload";
import { ApiError } from "./errors";
import { md5 } from "./md5";
import { AimgTokenManager, shouldRetryManagedToken } from "./tokenManager";

export { ApiError } from "./errors";

const BASE_URL: string = import.meta.env.VITE_BASE_URL || "";

export const API_BASE = `${BASE_URL}/api`;
export const UPLOADS_BASE = `${BASE_URL}/uploads`;

interface RequestOptions {
  token?: string;
  requiresToken?: boolean;
  cache?: RequestCache;
  signal?: AbortSignal;
}

interface TokenIssueResult {
  token: string;
  role: "newbie" | "citizen" | "troll";
}

interface NativeErrorBody {
  error?: { code?: unknown; message?: unknown };
}

const tokenManager: AimgTokenManager = new AimgTokenManager(issueAimgToken);

export async function apiGet<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  return request<T>("GET", path, undefined, options);
}

export async function apiPost<T>(
  path: string,
  body: object,
  options: RequestOptions = {},
): Promise<T> {
  return request<T>("POST", path, body, options);
}

export async function apiPut<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  return request<T>("PUT", path, undefined, options);
}

export async function apiDelete<T>(
  path: string,
  body: object,
  options: RequestOptions = {},
): Promise<T> {
  return request<T>("DELETE", path, body, options);
}

export async function getAimgToken(): Promise<string> {
  return tokenManager.get();
}

export function clearAimgToken(): void {
  tokenManager.clear();
}

export async function getAltchaSolution(): Promise<string> {
  const challenge = await apiGet<AltchaChallenge>("/altcha");
  return solveAltcha(challenge);
}

export async function uploadAttachment(file: File): Promise<string> {
  const digest = await md5(await readAttachmentForUpload(file));
  const result = await apiPost<PresignResult>(
    "/attachments/presign",
    {
      md5: digest,
      mime: file.type,
      sizeBytes: file.size,
    },
    { requiresToken: true },
  );

  if (result.uploadUrl) {
    const uploadResponse = await fetch(result.uploadUrl, {
      method: "PUT",
      headers: { "Content-Type": file.type },
      body: file,
    });
    if (!uploadResponse.ok) {
      throw new ApiError(
        `添付ファイルのアップロードに失敗しました (HTTP ${uploadResponse.status})`,
        uploadResponse.status,
      );
    }
  }

  return result.attachmentId;
}

interface PresignResult {
  attachmentId: string;
  uploadUrl: string | null;
  reused: boolean;
}

async function issueAimgToken(): Promise<string> {
  const fingerprint = await getFingerprint();
  return request<TokenIssueResult>("POST", "/tokens", {
    metrics: {
      fingerprint,
      userAgent: navigator.userAgent,
      language: navigator.language,
    },
  }).then((result) => result.token);
}

async function request<T>(
  method: "GET" | "POST" | "PUT" | "DELETE",
  path: string,
  body?: object,
  options: RequestOptions = {},
  retryCount: number = 0,
): Promise<T> {
  const headers: Record<string, string> = { Accept: "application/json" };
  let token = options.token;
  if (options.requiresToken && !token) {
    token = await getAimgToken();
  }
  if (token) headers["x-aimg-token"] = token;

  if (body) headers["Content-Type"] = "application/json";

  const response = await fetch(`${API_BASE}${path}`, {
    method,
    credentials: "same-origin",
    cache: options.cache,
    signal: options.signal,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const payload: unknown = await readJson(response);
  if (!response.ok) {
    const error = makeApiError(payload, response.status);
    if (
      token &&
      shouldRetryManagedToken(
        Boolean(options.requiresToken),
        Boolean(options.token),
        retryCount,
        error.code,
      )
    ) {
      const freshToken = await tokenManager.refresh(token);
      return request<T>(
        method,
        path,
        body,
        { ...options, token: freshToken },
        retryCount + 1,
      );
    }
    if (error.code === "TOKEN_EXPIRED" && token) tokenManager.clear(token);
    throw error;
  }

  return payload as T;
}

async function readJson(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return undefined;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

function makeApiError(payload: unknown, status: number): ApiError {
  const body = isNativeErrorBody(payload) ? payload.error : undefined;
  const message =
    typeof body?.message === "string" ? body.message : `HTTP ${status}`;
  const code = typeof body?.code === "string" ? body.code : undefined;
  return new ApiError(message, status, code);
}

function isNativeErrorBody(value: unknown): value is NativeErrorBody {
  return typeof value === "object" && value !== null && "error" in value;
}
