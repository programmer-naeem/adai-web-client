/**
 * Money helpers. Amounts are integer paisa (1 BDT = 100 paisa) inside the app
 * and decimal strings ("12500.00") on the API boundary (plan §11.1, BR-2.1).
 * Never do binary floating-point arithmetic on money.
 */

export type Paisa = number & { readonly __brand: "Paisa" };

const BN_DIGITS = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"] as const;

export function asPaisa(value: number): Paisa {
  if (!Number.isSafeInteger(value)) {
    throw new Error("Paisa must be a safe integer");
  }
  return value as Paisa;
}

export function toBnDigits(input: string): string {
  return input.replace(/\d/g, (digit) => BN_DIGITS[Number(digit)] ?? digit);
}

/** Parse a decimal string ("12500.00" or "-3000") into paisa. Rejects floats and >2 decimals. */
export function parseMoneyToPaisa(value: string): Paisa {
  const trimmed = value.trim();
  if (!/^-?\d+(\.\d{1,2})?$/.test(trimmed)) {
    throw new Error(`Invalid money: ${value}`);
  }
  const negative = trimmed.startsWith("-");
  const unsigned = negative ? trimmed.slice(1) : trimmed;
  const [takaPart, frac = ""] = unsigned.split(".");
  const fracPadded = (frac + "00").slice(0, 2);
  const taka = Number(takaPart);
  const fraction = Number(fracPadded);
  if (!Number.isSafeInteger(taka) || !Number.isSafeInteger(fraction)) {
    throw new Error("Money overflow");
  }
  const paisa = taka * 100 + fraction;
  if (!Number.isSafeInteger(paisa)) throw new Error("Money overflow");
  return asPaisa(negative ? -paisa : paisa);
}

/** Banker's rounding is not used. Midpoint rounds away from zero (BR-2.3). */
export function roundHalfAwayFromZero(value: number, decimals = 2): number {
  const factor = 10 ** decimals;
  const scaled = value * factor;
  const rounded = scaled < 0 ? -Math.round(Math.abs(scaled)) : Math.round(Math.abs(scaled));
  return rounded / factor;
}

export function paisaToMoneyString(paisa: number): string {
  if (!Number.isSafeInteger(paisa)) throw new Error("Paisa must be an integer");
  const sign = paisa < 0 ? "-" : "";
  const abs = Math.abs(paisa);
  const taka = Math.floor(abs / 100);
  const frac = abs % 100;
  return `${sign}${taka}.${frac.toString().padStart(2, "0")}`;
}

/** Indian/Bangladeshi grouping: 1234567 → 12,34,567 (BR-2.4). */
export function groupLakh(integerDigits: string): string {
  const sign = integerDigits.startsWith("-") ? "-" : "";
  const digits = sign ? integerDigits.slice(1) : integerDigits;
  if (digits.length <= 3) return sign + digits;
  const head = digits.slice(0, -3);
  const tail = digits.slice(-3);
  const groupedHead = head.replace(/\B(?=(\d{2})+(?!\d))/g, ",");
  return `${sign}${groupedHead},${tail}`;
}

export interface FormatBdtOptions {
  locale?: "bn" | "en";
  withSymbol?: boolean;
  /** Hide .00 so totals match the shop-ledger designs. */
  trimZeroFraction?: boolean;
}

export function formatBDT(paisa: number, options: FormatBdtOptions = {}): string {
  const { locale = "bn", withSymbol = true, trimZeroFraction = true } = options;
  if (!Number.isSafeInteger(paisa)) throw new Error("Paisa must be an integer");
  const sign = paisa < 0 ? "-" : "";
  const abs = Math.abs(paisa);
  const taka = Math.floor(abs / 100);
  const frac = abs % 100;
  const grouped = groupLakh(String(taka));
  const showFrac = !trimZeroFraction || frac !== 0;
  const body = showFrac ? `${grouped}.${frac.toString().padStart(2, "0")}` : grouped;
  const withSign = `${sign}${body}`;
  const localized = locale === "bn" ? toBnDigits(withSign) : withSign;
  return withSymbol ? `৳${localized}` : localized;
}

export function formatBdtString(value: string, options?: FormatBdtOptions): string {
  return formatBDT(parseMoneyToPaisa(value), options);
}

export function addPaisa(a: number, b: number): Paisa {
  return asPaisa(a + b);
}

export function comparePaisa(a: number, b: number): number {
  return a === b ? 0 : a < b ? -1 : 1;
}

/** Percent of an amount, rounded once away from zero to paisa (BR-2.3). */
export function percentOfPaisa(amountPaisa: number, percent: number): Paisa {
  if (!Number.isInteger(amountPaisa)) throw new Error("Paisa must be an integer");
  const raw = (amountPaisa * percent) / 100;
  const negative = raw < 0;
  const abs = Math.abs(raw);
  const rounded = Math.floor(abs + 0.5);
  return asPaisa(negative ? -rounded : rounded);
}
