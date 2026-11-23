/** Bangladesh mobile numbers. BR-1.2: `^\+8801[3-9]\d{8}$`. */

const E164 = /^\+8801[3-9]\d{8}$/;

export class PhoneError extends Error {
  readonly rule = "BR-1.2";
  constructor(message = "Invalid Bangladesh mobile number") {
    super(message);
    this.name = "PhoneError";
  }
}

/**
 * Accepts 017..., 8801..., +8801... and separators (spaces, hyphens).
 * Returns E.164 or throws PhoneError.
 */
export function normalizeBdPhone(input: string): string {
  const stripped = input.trim().replace(/[\s\-().]/g, "");
  let digits = stripped.startsWith("+") ? stripped.slice(1) : stripped;
  if (digits.startsWith("00880")) digits = digits.slice(2);
  if (digits.startsWith("880")) digits = digits.slice(3);
  else if (digits.startsWith("0")) digits = digits.slice(1);
  if (!/^1[3-9]\d{8}$/.test(digits)) {
    throw new PhoneError();
  }
  const e164 = `+880${digits}`;
  if (!E164.test(e164)) throw new PhoneError();
  return e164;
}

export function isBdPhone(input: string): boolean {
  try {
    normalizeBdPhone(input);
    return true;
  } catch {
    return false;
  }
}

/** 01711-234567, with Bangla digits when locale is bn. */
export function formatPhone(e164: string, locale: "bn" | "en" = "bn"): string {
  const normalized = e164.startsWith("+880") ? e164 : normalizeBdPhone(e164);
  const local = `0${normalized.slice(4)}`;
  const pretty = `${local.slice(0, 5)}-${local.slice(5)}`;
  return locale === "bn" ? pretty.replace(/\d/g, (d) => "০১২৩৪৫৬৭৮৯"[Number(d)]!) : pretty;
}

export function telHref(e164: string): string {
  return `tel:${e164}`;
}

export function whatsAppHref(e164: string, text?: string): string {
  const number = e164.replace("+", "");
  const base = `https://wa.me/${number}`;
  return text ? `${base}?text=${encodeURIComponent(text)}` : base;
}
