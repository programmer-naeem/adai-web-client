import { setAccessToken } from "@/lib/api/token";
import type { AuthResult, Me } from "@/lib/api/types";

const KEY = "aadai.session";

export interface StoredSession {
  accessToken: string;
  refreshToken: string;
  user: Me;
}

export function readSession(): StoredSession | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredSession;
  } catch {
    return null;
  }
}

export function writeSession(session: StoredSession): void {
  window.localStorage.setItem(KEY, JSON.stringify(session));
  setAccessToken(session.accessToken);
}

export function clearSession(): void {
  window.localStorage.removeItem(KEY);
  setAccessToken(null);
}

export async function publishSessionCookie(refreshToken: string): Promise<void> {
  await fetch("/api/auth/session", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  });
}

export async function clearSessionCookie(): Promise<void> {
  await fetch("/api/auth/session", { method: "DELETE" });
}

export function sessionFromAuth(result: AuthResult): StoredSession {
  return { accessToken: result.accessToken, refreshToken: result.refreshToken, user: result.user };
}
