import { toBnDigits } from "@/lib/money";

/** Named placeholders from BR-8.7 / Appendix B. */
export const TEMPLATE_PLACEHOLDERS = [
  "customer_name",
  "business_name",
  "balance",
  "overdue_amount",
  "due_date",
  "last_payment_amount",
  "last_payment_date",
  "statement_link",
  "promise_amount",
  "promise_date",
  "receipt_no",
  "amount",
  "business_phone",
  "date",
  "collected",
  "new_dues",
  "receivable",
  "ptp_tomorrow",
  "ptp_broken",
  "code",
] as const;

export type TemplatePlaceholder = (typeof TEMPLATE_PLACEHOLDERS)[number];

const PLACEHOLDER_RE = /\{\{\s*([a-z0-9_]+)\s*\}\}/g;

export function templatePlaceholders(body: string): string[] {
  return [...body.matchAll(PLACEHOLDER_RE)].map((match) => match[1]!);
}

export class UnknownPlaceholderError extends Error {
  readonly placeholder: string;
  constructor(placeholder: string) {
    super(`Unknown placeholder {{${placeholder}}}`);
    this.name = "UnknownPlaceholderError";
    this.placeholder = placeholder;
  }
}

export function renderTemplate(
  body: string,
  variables: Record<string, string>,
  options?: { banglaNumerals?: boolean },
): string {
  const unknown = templatePlaceholders(body).filter((key) => !TEMPLATE_PLACEHOLDERS.includes(key as TemplatePlaceholder));
  if (unknown.length > 0) throw new UnknownPlaceholderError(unknown[0]!);
  return body.replace(PLACEHOLDER_RE, (_, key: string) => {
    const value = variables[key] ?? "";
    return options?.banglaNumerals ? toBnDigits(value) : value;
  });
}
