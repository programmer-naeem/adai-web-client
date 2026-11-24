import type { Role } from "@/lib/permissions";

export interface TokenPayload {
  sub: string;
  tid: string;
  role: Role;
  exp: number;
}

let accessToken: string | null = null;

export function setAccessToken(token: string | null): void {
  accessToken = token;
}

export function getAccessToken(): string | null {
  return accessToken;
}

function toBase64Url(json: string): string {
  const bytes = new TextEncoder().encode(json);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function fromBase64Url(value: string): string {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

export function issueToken(payload: TokenPayload): string {
  return `mock.${toBase64Url(JSON.stringify(payload))}.sig`;
}

export function readToken(token: string): TokenPayload {
  const [, body] = token.split(".");
  if (!body) throw new Error("Malformed token");
  return JSON.parse(fromBase64Url(body)) as TokenPayload;
}

export function issueRefreshToken(): string {
  return `rfr.${toBase64Url(crypto.randomUUID())}`;
}
