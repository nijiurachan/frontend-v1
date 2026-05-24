const BASE_URL: string = import.meta.env.VITE_BASE_URL || "";

export const API_BASE = `${BASE_URL}/api`;
export const UPLOADS_BASE = `${BASE_URL}/uploads`;

export class ApiError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    credentials: "same-origin",
    headers: { Accept: "application/json" },
  });

  if (!res.ok) {
    throw new ApiError(`HTTP ${res.status}`, res.status);
  }

  const json = await res.json();
  if (!json.ok) {
    throw new ApiError(json.error || "Unknown error");
  }

  return json.data;
}

export async function apiPost<T>(
  path: string,
  body: FormData | object,
): Promise<T> {
  const isFormData = body instanceof FormData;

  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    credentials: "same-origin",
    body: isFormData ? body : JSON.stringify(body),
    headers: isFormData ? {} : { "Content-Type": "application/json" },
  });

  const json = await res.json();
  if (!json.ok) {
    throw new ApiError(json.error || "Unknown error");
  }

  return json.data ?? json;
}
