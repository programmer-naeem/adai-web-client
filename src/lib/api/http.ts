import { ApiError, type ProblemDetails } from "@/lib/problem";
import { getAccessToken, setAccessToken } from "@/lib/api/token";

const BASE = () => process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") || "https://api.aadai.app/api/v1";

let refreshInFlight: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  if (!refreshInFlight) {
    refreshInFlight = fetch("/api/auth/refresh", { method: "POST" })
      .then(async (response) => {
        if (!response.ok) return null;
        const body = (await response.json()) as { accessToken?: string };
        if (!body.accessToken) return null;
        setAccessToken(body.accessToken);
        return body.accessToken;
      })
      .finally(() => {
        refreshInFlight = null;
      });
  }
  return refreshInFlight;
}

export async function apiFetch<T>(path: string, init: RequestInit = {}, attempt = 0): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  const token = getAccessToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);
  const response = await fetch(`${BASE()}${path}`, { ...init, headers });
  if (response.status === 401 && attempt === 0 && !path.startsWith("/auth/")) {
    const next = await refreshAccessToken();
    if (next) return apiFetch<T>(path, init, attempt + 1);
  }
  if (response.status === 204) return undefined as T;
  const text = await response.text();
  const data = text ? (JSON.parse(text) as unknown) : undefined;
  if (!response.ok) {
    const problem = (data ?? {}) as Partial<ProblemDetails>;
    throw new ApiError(problem.status ?? response.status, problem.code ?? "INTERNAL_ERROR", {
      title: problem.title,
      rule: problem.rule,
      errors: problem.errors,
    });
  }
  return data as T;
}

export function postJson<T>(path: string, body: unknown, idempotencyKey?: string): Promise<T> {
  return apiFetch<T>(path, {
    method: "POST",
    body: JSON.stringify(body),
    headers: idempotencyKey ? { "Idempotency-Key": idempotencyKey } : undefined,
  });
}
