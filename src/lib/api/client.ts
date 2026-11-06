import { ApiError } from "./errors";

const API_PREFIX = "/api/v1";

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function isUnsafe(method: string): boolean {
  return !["GET", "HEAD", "OPTIONS", "TRACE"].includes(method.toUpperCase());
}

async function ensureCsrfToken(): Promise<string | null> {
  const token = readCookie("csrftoken");
  if (token) return token;
  try {
    await fetch(`${API_PREFIX}/auth/csrf/`, { credentials: "same-origin" });
    return readCookie("csrftoken");
  } catch {
    return null;
  }
}

export interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
  idempotencyKey?: string;
  locale?: string;
}

export interface Pagination {
  page: number;
  page_size: number;
  count: number;
}

export interface ApiEnvelope<T> {
  data: T;
  metadata: { request_id: string; pagination: Pagination | null };
}

interface Envelope<T> extends ApiEnvelope<T> {
  errors: Array<{ code: string; message: string; fields: Record<string, string> | null }>;
}

/**
 * Thin wrapper over the Django API. Returns the full `{data, metadata}` envelope.
 * Attaches the CSRF token to mutating requests, and normalizes failures into
 * ApiError. Money values stay decimal strings end to end.
 */
export async function apiEnvelope<T>(
  path: string,
  options: RequestOptions = {},
): Promise<ApiEnvelope<T>> {
  const method = (options.method ?? "GET").toUpperCase();
  const headers: Record<string, string> = {
    Accept: "application/json",
  };
  if (options.locale) headers["Accept-Language"] = options.locale;
  if (options.body !== undefined) headers["Content-Type"] = "application/json";

  if (isUnsafe(method)) {
    const token = await ensureCsrfToken();
    if (token) headers["X-CSRFToken"] = token;
  }
  if (options.idempotencyKey) headers["Idempotency-Key"] = options.idempotencyKey;

  let response: Response;
  try {
    response = await fetch(`${API_PREFIX}${path}`, {
      method,
      headers,
      credentials: "same-origin",
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    });
  } catch {
    throw new ApiError("network_error", "Could not reach the server.", 0);
  }

  let envelope: Envelope<T> | null = null;
  try {
    envelope = (await response.json()) as Envelope<T>;
  } catch {
    envelope = null;
  }

  if (!response.ok) {
    const error = envelope?.errors?.[0];
    throw new ApiError(
      error?.code ?? "http_error",
      error?.message ?? `Request failed with status ${response.status}.`,
      response.status,
      error?.fields ?? null,
    );
  }
  if (!envelope) {
    throw new ApiError("invalid_response", "The server returned an invalid response.", response.status);
  }
  return { data: envelope.data, metadata: envelope.metadata };
}

/**
 * Convenience wrapper returning only `data` for endpoints whose pagination is
 * irrelevant. Prefer `apiEnvelope` for paginated lists.
 */
export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  return (await apiEnvelope<T>(path, options)).data;
}

export const api = {
  get: <T>(path: string, locale?: string) => apiRequest<T>(path, { locale }),
  getPage: <T>(path: string, locale?: string) => apiEnvelope<T>(path, { locale }),
  post: <T>(path: string, body?: unknown, idempotencyKey?: string, locale?: string) =>
    apiRequest<T>(path, { method: "POST", body, idempotencyKey, locale }),
  patch: <T>(path: string, body?: unknown, locale?: string) =>
    apiRequest<T>(path, { method: "PATCH", body, locale }),
  put: <T>(path: string, body?: unknown, locale?: string) =>
    apiRequest<T>(path, { method: "PUT", body, locale }),
  delete: <T>(path: string, locale?: string) => apiRequest<T>(path, { method: "DELETE", locale }),
};
