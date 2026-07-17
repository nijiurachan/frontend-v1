import { getFingerprint } from "@/shared/lib/fingerprint";
import { type AltchaChallenge, solveAltcha } from "./altcha";
import { md5 } from "./md5";

const BASE_URL: string = import.meta.env.VITE_BASE_URL || "";

export const API_BASE = `${BASE_URL}/api`;
export const UPLOADS_BASE = `${BASE_URL}/uploads`;

export class ApiError extends Error {
  status?: number;
  code?: string;

  constructor(message: string, status?: number, code?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

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

let cachedToken: string | null = null;
let tokenPromise: Promise<string> | null = null;

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
  if (cachedToken) return cachedToken;
  if (tokenPromise) return tokenPromise;

  tokenPromise = issueAimgToken();
  try {
    cachedToken = await tokenPromise;
    return cachedToken;
  } finally {
    tokenPromise = null;
  }
}

export function clearAimgToken(): void {
  cachedToken = null;
}

export async function getAltchaSolution(): Promise<string> {
  const challenge = await apiGet<AltchaChallenge>("/altcha");
  return solveAltcha(challenge);
}

export async function uploadAttachment(file: File): Promise<string> {
  const digest = await md5(await file.arrayBuffer());
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
    throw makeApiError(payload, response.status);
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
  if (code === "TOKEN_EXPIRED") clearAimgToken();
  return new ApiError(message, status, code);
}

function isNativeErrorBody(value: unknown): value is NativeErrorBody {
  return typeof value === "object" && value !== null && "error" in value;
}
