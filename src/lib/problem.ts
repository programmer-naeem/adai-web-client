/** RFC 9457 problem shape used by both mock and real clients (plan §11.1). */

export interface ProblemDetails {
  type?: string;
  title: string;
  status: number;
  code: string;
  traceId?: string;
  rule?: string;
  errors?: Record<string, string[]>;
}

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly rule?: string;
  readonly errors?: Record<string, string[]>;

  constructor(status: number, code: string, extras?: { rule?: string; errors?: Record<string, string[]>; title?: string }) {
    super(extras?.title ?? code);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.rule = extras?.rule;
    this.errors = extras?.errors;
  }

  toProblem(): ProblemDetails {
    return {
      type: `https://docs.aadai.app/errors/${this.code.toLowerCase()}`,
      title: this.message,
      status: this.status,
      code: this.code,
      rule: this.rule,
      errors: this.errors,
    };
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}
