import { isApiError } from "@/lib/problem";

export function errorCode(error: unknown): string {
  if (!isApiError(error)) return "UNKNOWN";
  const field = error.errors ? Object.values(error.errors).flat()[0] : undefined;
  return (field ?? error.rule ?? error.code).replaceAll(".", "_").replaceAll("-", "_");
}
