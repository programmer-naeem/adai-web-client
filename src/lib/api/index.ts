import type { ApiClient } from "@/lib/api/client";
import { mockApi } from "@/lib/api/mock/api";
import { realApi } from "@/lib/api/real/api";

export function apiMode(): "mock" | "real" {
  return process.env.NEXT_PUBLIC_API_MODE === "real" ? "real" : "mock";
}

/** Screens and hooks call this. They never call fetch themselves. */
export function getApi(): ApiClient {
  return apiMode() === "real" ? realApi : mockApi;
}

export { ApiError, isApiError } from "@/lib/problem";
export type { ApiClient } from "@/lib/api/client";
